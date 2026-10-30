"""Avoid module/package name ambiguity: load the entrypoint under a unique name."""
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('agribovix_entrypoint', Path(__file__).with_name('app.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
application = module.application
