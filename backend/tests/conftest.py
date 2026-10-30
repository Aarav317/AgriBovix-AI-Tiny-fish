import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from run import application
from app.routes.auth import attempts

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_PATH', str(tmp_path / 'test.db'))
    for w in ('AGRIVISION','PASHUVISION'):
        monkeypatch.delenv(f'{w}_MODEL_URL',raising=False)
        monkeypatch.delenv(f'{w}_ASSISTANT_URL',raising=False)
    attempts.clear()
    with TestClient(application) as client:
        yield client

@pytest.fixture
def image_bytes():
    import io
    from PIL import Image
    buffer=io.BytesIO()
    Image.new('RGB',(64,64),'green').save(buffer,format='PNG')
    return buffer.getvalue()

@pytest.fixture
def register(client):
    response=client.post('/api/auth/register',json={'name':'Test Farmer','email':'farmer@example.test','password':'a-secure-test-password'})
    assert response.status_code==201
    return response.json()

@pytest.fixture
def valid_prediction():
    # Test fixture only. Never returned by the production application by default.
    return {'subject':'Test subject','possible_condition':None,'model_name':'TEST-ONLY adapter','confidence':None,'observations':['Test observation.'],'care_steps':['Ask an expert to review.'],'prevention':[],'treatment_options':[],'limitations':['Synthetic test fixture, not a real prediction.'],'urgency':'expert_review','sources':[]}
