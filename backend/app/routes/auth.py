import secrets
import sqlite3
import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from app.database.store import connection
from app.models.schemas import RegisterInput, LoginInput
from app.services.auth import COOKIE, current_user, hash_password, verify_password, start_session, token_hash

router = APIRouter(prefix='/api/auth')
attempts = defaultdict(deque)
attempt_lock = Lock()
dummy_hash = hash_password(secrets.token_urlsafe(20))

def limit_auth(request):
    address = request.client.host if request.client else 'unknown'
    now = time.monotonic()
    with attempt_lock:
        for key in list(attempts):
            while attempts[key] and attempts[key][0] < now - 60:
                attempts[key].popleft()
            if not attempts[key]:
                del attempts[key]
        bucket = attempts[address]
        if len(bucket) >= 15:
            raise HTTPException(429, detail={'code':'rate_limited','message':'Too many sign-in attempts. Try again in a minute.'})
        bucket.append(now)

@router.post('/register', status_code=201)
def register(data: RegisterInput, request: Request, response: Response):
    limit_auth(request)
    user = {'id':secrets.token_hex(16),'name':data.name,'email':data.email}
    try:
        with connection() as db:
            db.execute('INSERT INTO users (id,name,email,password_hash) VALUES (?,?,?,?)', (*user.values(),hash_password(data.password)))
    except sqlite3.IntegrityError:
        raise HTTPException(409, detail={'code':'email_in_use','message':'An account with that email already exists.'})
    start_session(response, user['id'])
    return user

@router.post('/login')
def login(data: LoginInput, request: Request, response: Response):
    limit_auth(request)
    with connection() as db:
        row = db.execute('SELECT * FROM users WHERE email=?', (data.email.strip().lower(),)).fetchone()
    valid = verify_password(data.password, row['password_hash'] if row else dummy_hash)
    if not row or not valid:
        raise HTTPException(401, detail={'code':'invalid_credentials','message':'Email or password is incorrect.'})
    start_session(response, row['id'])
    return {key:row[key] for key in ('id','name','email')}

@router.get('/me')
def me(user=Depends(current_user)):
    return user

@router.post('/logout', status_code=204)
def logout(request: Request, response: Response):
    with connection() as db:
        db.execute('DELETE FROM sessions WHERE token_hash=?', (token_hash(request.cookies.get(COOKIE,'')),))
    response.delete_cookie(COOKIE, path='/')
