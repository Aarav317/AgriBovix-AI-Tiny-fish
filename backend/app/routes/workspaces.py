import json
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.config import WORKSPACES
from app.database.store import connection
from app.services.auth import current_user
from app.services import providers
from app.validators.images import validated_image
from app.models.schemas import AssistantInput

router = APIRouter(prefix='/api')

def workspace_name(workspace: str):
    if workspace not in WORKSPACES:
        raise HTTPException(404, detail={'code':'not_found','message':'Workspace not found.'})
    return workspace

@router.post('/{workspace}/analyze')
async def analyze(workspace: str, image: UploadFile = File(...), task: str = Form('general'), language: str = Form('en'), user=Depends(current_user)):
    workspace_name(workspace)
    supported = {'general','crop','maturity','disease'} if workspace == 'agrivision' else {'general','breed','health'}
    if task not in supported:
        raise HTTPException(422, detail={'code':'unsupported_task','message':'That analysis task does not belong to this workspace.'})
    try:
        payload = await validated_image(image)
    finally:
        await image.close()
    result = await providers.analyze(workspace, payload, task, language)
    report = {'id':secrets.token_hex(16),'workspace':workspace,'filename':(image.filename or 'image')[:200], 'created_at':datetime.now(timezone.utc).isoformat(), 'result':result}
    with connection() as db:
        db.execute('INSERT INTO scans VALUES (?,?,?,?,?,?)', (report['id'], user['id'], workspace,report['filename'], json.dumps(result),report['created_at']))
    return report

@router.get('/{workspace}/history')
def history(workspace: str, user=Depends(current_user), limit: int = 50, offset: int = 0):
    workspace_name(workspace)
    if not 1 <= limit <= 100 or offset < 0:
        raise HTTPException(422, detail={'code':'invalid_pagination','message':'Invalid history page.'})
    with connection() as db:
        rows = db.execute('SELECT id,workspace,filename,result_json,created_at FROM scans WHERE user_id=? AND workspace=? ORDER BY created_at DESC LIMIT ? OFFSET ?', (user['id'],workspace,limit,offset)).fetchall()
        count = db.execute('SELECT COUNT(*) FROM scans WHERE user_id=? AND workspace=?', (user['id'],workspace)).fetchone()[0]
    return {'items':[{'id':r['id'],'workspace':r['workspace'],'filename':r['filename'],'created_at':r['created_at'],'result':json.loads(r['result_json'])} for r in rows], 'total':count}

@router.delete('/{workspace}/history/{scan_id}', status_code=204)
def delete_scan(workspace: str, scan_id: str, user=Depends(current_user)):
    workspace_name(workspace)
    with connection() as db:
        cursor = db.execute('DELETE FROM scans WHERE id=? AND user_id=? AND workspace=?', (scan_id,user['id'],workspace))
        if not cursor.rowcount:
            raise HTTPException(404, detail={'code':'not_found','message':'Report not found.'})

@router.post('/assistant/{workspace}')
async def assistant(workspace: str, data: AssistantInput, user=Depends(current_user)):
    workspace_name(workspace)
    return await providers.assistant(
        workspace,
        [message.model_dump() for message in data.messages],
        data.language,
    )
