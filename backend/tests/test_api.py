import io
import pytest
from PIL import Image
from app.database.store import connection
from app.services import providers

def test_health_honest_unconfigured(client):
    response=client.get('/api/health')
    assert response.status_code==200
    assert all(not w['analysis_configured'] and not w['assistant_configured'] for w in response.json()['workspaces'].values())

def test_auth_private_history(client):
    assert client.get('/api/agrivision/history').status_code==401
    assert client.get('/api/pashuvision/history').status_code==401

def test_register_login_logout_and_hashing(client,register):
    assert client.get('/api/auth/me').json()['id']==register['id']
    cookie=client.cookies.get('agribovix_session')
    with connection() as db:
        row=db.execute('SELECT password_hash FROM users').fetchone()
        assert 'a-secure-test-password' not in row['password_hash']
        assert db.execute('SELECT token_hash FROM sessions').fetchone()['token_hash'] != cookie
    assert 'httponly' in client.post('/api/auth/login',json={'email':'FARMER@example.test','password':'a-secure-test-password'}).headers['set-cookie'].lower()
    assert client.post('/api/auth/logout').status_code==204
    assert client.get('/api/auth/me').status_code==401
    assert client.post('/api/auth/login',json={'email':'farmer@example.test','password':'wrong'}).status_code==401
    assert client.post('/api/auth/login',json={'email':'farmer@example.test','password':'a-secure-test-password'}).status_code==200

def test_invalid_registration_does_not_echo_password(client):
    response=client.post('/api/auth/register',json={'name':'A','email':'bad','password':'secret'})
    assert response.status_code==422
    assert 'secret' not in response.text

def test_duplicate_account(client,register):
    response=client.post('/api/auth/register',json={'name':'Other','email':'farmer@example.test','password':'another-long-password'})
    assert response.status_code==409

def test_cross_site_change_rejected(client):
    assert client.post('/api/auth/logout',headers={'Origin':'https://evil.example'}).status_code==403
    assert client.post('/api/auth/logout',headers={'Sec-Fetch-Site':'cross-site'}).status_code==403

@pytest.mark.parametrize('workspace',['agrivision','pashuvision'])
def test_no_model_never_fabricates_or_saves(client,register,image_bytes,workspace):
    response=client.post(f'/api/{workspace}/analyze',files={'image':('leaf.png',image_bytes,'image/png')})
    assert response.status_code==503
    assert response.json()['detail']['code']=='model_unavailable'
    assert client.get(f'/api/{workspace}/history').json()=={'items':[],'total':0}

def test_analysis_language_is_forwarded_to_provider(client,register,image_bytes,valid_prediction,monkeypatch):
    received={}
    async def stub(workspace,image,task,language):
        received.update(workspace=workspace,task=task,language=language)
        return valid_prediction
    monkeypatch.setattr(providers,'analyze',stub)

    response=client.post('/api/agrivision/analyze',data={'task':'crop','language':'kn'},files={'image':('leaf.png',image_bytes,'image/png')})

    assert response.status_code==200
    assert received=={'workspace':'agrivision','task':'crop','language':'kn'}

@pytest.mark.parametrize('workspace',['agrivision','pashuvision'])
def test_assistant_unavailable(client,register,workspace):
    response=client.post(f'/api/assistant/{workspace}',json={'messages':[{'role':'user','content':'A test question'}]})
    assert response.status_code==503
    assert 'message' in response.json()['detail']

def test_assistant_language_is_forwarded(client,register,monkeypatch):
    received={}
    async def stub(workspace,messages,language):
        received.update(workspace=workspace,language=language)
        return {'message':'ನಮಸ್ಕಾರ','sources':[]}
    monkeypatch.setattr(providers,'assistant',stub)

    response=client.post('/api/assistant/pashuvision',json={
        'messages':[{'role':'user','content':'ಹಲೋ'}],
        'language':'kn',
    })

    assert response.status_code==200
    assert received=={'workspace':'pashuvision','language':'kn'}

def test_unsupported_assistant_language_falls_back_to_english(client,register,monkeypatch):
    received={}
    async def stub(workspace,messages,language):
        received['language']=language
        return {'message':'Response in English.','sources':[]}
    monkeypatch.setattr(providers,'assistant',stub)

    response=client.post('/api/assistant/agrivision',json={
        'messages':[{'role':'user','content':'A test question'}],
        'language':'unsupported',
    })

    assert response.status_code==200
    assert received['language']=='en'

def test_bad_file_and_size(client,register):
    assert client.post('/api/agrivision/analyze',files={'image':('bad.exe',b'bad','application/octet-stream')}).status_code==415
    assert client.post('/api/agrivision/analyze',files={'image':('fake.png',b'not image','image/png')}).status_code==422
    assert client.post('/api/agrivision/analyze',files={'image':('big.jpg',b'x'*(8*1024*1024+1),'image/jpeg')}).status_code==413

def test_excessive_resolution(client,register):
    buffer=io.BytesIO()
    Image.new('1',(5000,5000)).save(buffer,format='PNG')
    response=client.post('/api/agrivision/analyze',files={'image':('huge.png',buffer.getvalue(),'image/png')})
    assert response.status_code==422

def test_missing_image(client,register):
    assert client.post('/api/agrivision/analyze').status_code==422

def test_cross_workspace_task_rejected(client,register,image_bytes):
    assert client.post('/api/agrivision/analyze',data={'task':'breed'},files={'image':('leaf.png',image_bytes,'image/png')}).status_code==422
    assert client.post('/api/pashuvision/analyze',data={'task':'maturity'},files={'image':('cow.png',image_bytes,'image/png')}).status_code==422

def test_scan_saved_only_for_correct_user_and_workspace(client,register,image_bytes,valid_prediction,monkeypatch):
    async def stub(*args,**kwargs):return valid_prediction
    monkeypatch.setattr(providers,'request_provider',stub)
    response=client.post('/api/agrivision/analyze',files={'image':('leaf.png',image_bytes,'image/png')})
    assert response.status_code==200
    scan_id=response.json()['id']
    assert client.get('/api/agrivision/history').json()['total']==1
    assert client.get('/api/pashuvision/history').json()['total']==0
    assert client.delete(f'/api/pashuvision/history/{scan_id}').status_code==404
    client.post('/api/auth/logout')
    client.post('/api/auth/register',json={'name':'Second Farmer','email':'second@example.test','password':'another-test-password'})
    assert client.get('/api/agrivision/history').json()['total']==0
    assert client.delete(f'/api/agrivision/history/{scan_id}').status_code==404
    client.post('/api/auth/login',json={'email':'farmer@example.test','password':'a-secure-test-password'})
    assert client.delete(f'/api/agrivision/history/{scan_id}').status_code==204
    assert client.get('/api/agrivision/history').json()['total']==0

def test_invalid_model_not_saved(client,register,image_bytes,valid_prediction,monkeypatch):
    async def stub(*args,**kwargs):return {**valid_prediction,'confidence':8}
    monkeypatch.setattr(providers,'request_provider',stub)
    assert client.post('/api/agrivision/analyze',files={'image':('leaf.png',image_bytes,'image/png')}).status_code==502
    assert client.get('/api/agrivision/history').json()['total']==0

@pytest.mark.parametrize('workspace,patch',[('agrivision',{'treatment_options':['Unsupported treatment']}),('pashuvision',{'care_steps':['Give 5 mg of medicine.']}),('pashuvision',{'treatment_options':['Medication advice'],'sources':[{'title':'Test source','url':'https://example.com'}]})])
def test_unsupported_treatment_blocked(client,register,image_bytes,valid_prediction,monkeypatch,workspace,patch):
    async def stub(*args,**kwargs):return {**valid_prediction,**patch}
    monkeypatch.setattr(providers,'request_provider',stub)
    assert client.post(f'/api/{workspace}/analyze',files={'image':('image.png',image_bytes,'image/png')}).status_code==502

def test_reencoding_removes_original_format(client,register,image_bytes,valid_prediction,monkeypatch):
    async def stub(workspace,kind,**kwargs):
        filename,payload,content_type=kwargs['files']['image']
        assert content_type=='image/jpeg'
        with Image.open(io.BytesIO(payload)) as image: assert image.format=='JPEG'
        return valid_prediction
    monkeypatch.setattr(providers,'request_provider',stub)
    assert client.post('/api/agrivision/analyze',files={'image':('image.png',image_bytes,'image/png')}).status_code==200

def test_analysis_report_includes_and_persists_tinyfish_sources(client,register,image_bytes,valid_prediction,monkeypatch):
    async def model_stub(*args,**kwargs):return valid_prediction
    async def research_stub(*args,**kwargs):
        return ([{'title':'Official guidance','url':'https://icar.org.in/guidance','snippet':'Search snippet.','content':'Retrieved page text.','retrieved':True}], 'complete', 'TinyFish search and page retrieval completed.')
    monkeypatch.setattr(providers,'request_provider',model_stub)
    monkeypatch.setattr(providers,'_tinyfish_research',research_stub)

    response=client.post('/api/agrivision/analyze',files={'image':('leaf.png',image_bytes,'image/png')})
    assert response.status_code==200
    result=response.json()['result']
    assert result['research_status']=='complete'
    assert result['sources'][0]['url']=='https://icar.org.in/guidance'
    assert result['sources'][0]['retrieved'] is True
    saved=client.get('/api/agrivision/history').json()['items'][0]['result']
    assert saved['sources'][0]['content']=='Retrieved page text.'

def test_invalid_workspace_and_pagination(client,register):
    assert client.get('/api/other/history').status_code==404
    assert client.get('/api/agrivision/history?limit=200').status_code==422
    assert client.get('/api/pashuvision/history?offset=-1').status_code==422

def test_login_throttle(client):
    for _ in range(15): client.post('/api/auth/login',json={'email':'absent@example.test','password':'test-password'})
    assert client.post('/api/auth/login',json={'email':'absent@example.test','password':'test-password'}).status_code==429
