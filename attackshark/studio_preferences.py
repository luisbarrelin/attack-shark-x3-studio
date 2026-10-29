"""Studio-only preferences, independent of mouse configuration."""
import json
import os
from pathlib import Path
import threading

PATH=Path(os.environ.get('APPDATA',str(Path.home()))) / 'attackshark-x3-studio-preferences.json'
_lock=threading.Lock()

def load():
    try:
        data=json.loads(PATH.read_text(encoding='utf-8'))
        return data if isinstance(data,dict) else {}
    except (OSError,ValueError):
        return {}

def update(**values):
    if 'language' in values and values['language'] not in ('pt-BR','en'):
        raise ValueError('Invalid language')
    with _lock:
        data=load();data.update(values)
        PATH.parent.mkdir(parents=True,exist_ok=True)
        temp=PATH.with_suffix('.json.tmp')
        temp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
        os.replace(temp,PATH)
        return data
