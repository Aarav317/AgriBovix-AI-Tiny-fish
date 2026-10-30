import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / '.env')

def database_path():
    path = Path(os.getenv('DATABASE_PATH', 'backend/data/agribovix.db'))
    return path if path.is_absolute() else ROOT / path

def provider_config(workspace, kind='MODEL'):
    prefix = workspace.upper()
    return os.getenv(f'{prefix}_{kind}_URL', '').strip(), os.getenv(f'{prefix}_{kind}_KEY', '')

def allowed_origins():
    return {os.getenv('FRONTEND_ORIGIN', 'http://127.0.0.1:3000'), 'http://localhost:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'}

WORKSPACES = ('agrivision', 'pashuvision')
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def gemini_config():
    return os.getenv('GEMINI_API_KEY', '').strip(), os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip()

def tinyfish_key():
    return os.getenv('TINYFISH_API_KEY', '').strip()
