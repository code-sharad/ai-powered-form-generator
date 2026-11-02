#!/usr/bin/env python3
"""Verify that dropping a file uploads it instead of navigating away.

Set FORM_URL to a public form with a file-upload field and FILE_PATH to an
image accepted by that field. Requires a running app, API, Chromium, and
chromedriver.
"""

import base64
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import time
import urllib.request

FORM_URL = os.environ.get('FORM_URL', 'http://localhost:3000/forms/workshop-registration')
ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'
FILE_PATH = Path(os.environ.get('FILE_PATH', Path(__file__).resolve().parents[2] / 'assets/image-1.png')).resolve()


def request(base, method, path, data=None):
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(base + path, data=payload, method=method,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)['value']


def main():
    if not FILE_PATH.is_file():
        raise FileNotFoundError(f'Image file not found: {FILE_PATH}')
    driver = shutil.which('chromedriver')
    if not driver:
        raise RuntimeError('Install chromedriver before running this check.')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    process = subprocess.Popen([driver, f'--port={port}', '--allowed-ips=127.0.0.1'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    session = None
    try:
        for _ in range(100):
            try:
                request(base, 'GET', '/status')
                break
            except Exception:
                time.sleep(0.1)
        result = request(base, 'POST', '/session', {
            'capabilities': {'alwaysMatch': {
                'browserName': 'chrome',
                'goog:chromeOptions': {'args': [
                    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
                    '--window-size=1280,900',
                ]},
            }},
        })
        session = result['sessionId']

        def command(method, path, data=None):
            return request(base, method, f'/session/{session}' + path, data)

        command('POST', '/url', {'url': FORM_URL})
        for _ in range(100):
            loaded = command('POST', '/execute/sync', {
                'script': "return !!document.querySelector('input[type=file]')",
                'args': [],
            })
            if loaded:
                break
            time.sleep(0.1)
        else:
            raise AssertionError(f'No file-upload input loaded at {FORM_URL}')

        assert command('POST', '/execute/sync', {
            'script': "const input=document.querySelector('input[type=file]'); return [...document.querySelectorAll('label')].some(label => label.control === input)",
            'args': [],
        }), 'Click label is not associated with the file input'
        rect = command('POST', '/execute/sync', {
            'script': "const r=document.querySelector('input[type=file]').parentElement.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}",
            'args': [],
        })
        dispatch = """const target = document.querySelector('input[type=file]').parentElement;
const bytes = Uint8Array.from(atob(arguments[0]), c => c.charCodeAt(0));
const file = new File([bytes], arguments[1], {type: arguments[2]});
const transfer = new DataTransfer(); transfer.items.add(file);
const event = new DragEvent(arguments[3], {bubbles:true,cancelable:true,dataTransfer:transfer});
target.dispatchEvent(event); return event.defaultPrevented;"""
        encoded = base64.b64encode(FILE_PATH.read_bytes()).decode()
        mime = 'image/png' if FILE_PATH.suffix.lower() == '.png' else 'image/jpeg'
        for event_type in ('dragenter', 'dragover'):
            prevented = command('POST', '/execute/sync', {
                'script': dispatch,
                'args': [encoded, FILE_PATH.name, mime, event_type],
            })
            assert prevented, f'{event_type} did not prevent the browser default'
        command('POST', '/execute/sync', {
            'script': dispatch,
            'args': [encoded, FILE_PATH.name, mime, 'drop'],
        })
        for _ in range(200):
            text = command('POST', '/execute/sync', {
                'script': "return document.body.innerText",
                'args': [],
            })
            if 'Uploaded' in text:
                break
            time.sleep(0.1)
        else:
            raise AssertionError(f'Dropped image did not upload. Page text: {text[-300:]}')
        current_url = command('GET', '/url')
        assert current_url == FORM_URL, f'Drop navigated away to {current_url}'
        command('POST', '/execute/sync', {
            'script': 'localStorage.clear(); sessionStorage.clear(); location.reload()', 'args': [],
        })
        for _ in range(100):
            if command('POST', '/execute/sync', {
                'script': "return !!document.querySelector('input[type=file]')", 'args': [],
            }):
                break
            time.sleep(0.1)
        input_id = command('POST', '/element', {
            'using': 'css selector', 'value': 'input[type=file]',
        })[ELEMENT]
        command('POST', f'/element/{input_id}/value', {'text': str(FILE_PATH)})
        for _ in range(200):
            text = command('POST', '/execute/sync', {
                'script': 'return document.body.innerText', 'args': [],
            })
            if 'Uploaded' in text:
                break
            time.sleep(0.1)
        else:
            raise AssertionError(f'Picker selection did not upload. Page text: {text[-300:]}')
        assert command('GET', '/url') == FORM_URL, 'Picker upload navigated away from the form'
        print('PASS drag/drop upload prevents navigation; file picker still uploads')
    finally:
        if session:
            try:
                request(base, 'DELETE', f'/session/{session}')
            except Exception:
                pass
        process.terminate()
        process.wait(timeout=5)


if __name__ == '__main__':
    main()
