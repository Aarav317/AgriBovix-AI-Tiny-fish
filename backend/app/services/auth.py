import hashlib
import hmac
import os
import secrets
import time
from fastapi import HTTPException, Request, Response
from app.database.store import connection

COOKIE = 'agribovix_session'
SESSION_SECONDS = 7 * 24 * 3600

def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return salt.hex() + ':' + digest.hex()

def verify_password(password, stored):
    salt, expected = stored.split(':')
    actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
    return hmac.compare_digest(actual.hex(), expected)

def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

def start_session(response: Response, user_id):
    token = secrets.token_urlsafe(32)
    with connection() as db:
        db.execute('DELETE FROM sessions WHERE expires_at < ?', (int(time.time()),))
        db.execute('INSERT INTO sessions VALUES (?,?,?)', (token_hash(token), user_id, int(time.time()) + SESSION_SECONDS))
    response.set_cookie(COOKIE, token, max_age=SESSION_SECONDS, httponly=True, secure=os.getenv('COOKIE_SECURE','false').lower() == 'true', samesite='lax', path='/')

def current_user(request: Request):
    token = request.cookies.get(COOKIE, '')
    if token:
        with connection() as db:
            row = db.execute('SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', (token_hash(token), int(time.time()))).fetchone()
            if row:
                return dict(row)
    raise HTTPException(401, detail={'code':'authentication_required', 'message':'Sign in to keep your scans and reports private.'})
