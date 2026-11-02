#!/usr/bin/env python3
import base64
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
import uuid


APP_URL = os.environ.get('APP_URL', 'http://localhost:3000').rstrip('/')
API_URL = os.environ.get('API_URL', 'http://localhost:8080/api/v1').rstrip('/')
ARTIFACTS = Path('/tmp/formora-feedback-verification')
ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'


def wait_for(check, description, timeout=15):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        result = check()
        if result:
            return result
        time.sleep(0.1)
    raise AssertionError(f'Timed out waiting for {description}')


def api_post(path, data):
    request = urllib.request.Request(
        API_URL + path,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


class Browser:
    def __init__(self):
        driver = shutil.which('chromedriver')
        if not driver:
            raise RuntimeError('Install chromedriver before running this check.')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        self.url = f'http://127.0.0.1:{port}'
        self.session = None
        self.process = subprocess.Popen(
            [driver, f'--port={port}', '--allowed-ips=127.0.0.1'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            wait_for(self.ready, 'chromedriver')
            value = self.request('POST', '/session', {
                'capabilities': {'alwaysMatch': {
                    'browserName': 'chrome',
                    'goog:chromeOptions': {'args': [
                        '--headless=new', '--no-sandbox',
                        '--disable-dev-shm-usage', '--window-size=1440,1000',
                    ]},
                    'goog:loggingPrefs': {'performance': 'ALL'},
                }},
            })
            self.session = value['sessionId']
            self.cdp('Network.enable')
        except Exception:
            self.close()
            raise

    def ready(self):
        try:
            return self.request('GET', '/status')['ready']
        except (urllib.error.URLError, ConnectionError):
            return False

    def request(self, method, path, data=None):
        request = urllib.request.Request(
            self.url + path,
            method=method,
            data=json.dumps(data).encode() if data is not None else None,
            headers={'Content-Type': 'application/json'},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)['value']
        except urllib.error.HTTPError as error:
            raise RuntimeError(error.read().decode()) from error

    def command(self, method, path, data=None):
        return self.request(method, f'/session/{self.session}' + path, data)

    def js(self, script, *args):
        return self.command('POST', '/execute/sync', {
            'script': script, 'args': list(args),
        })

    def cdp(self, command, **params):
        return self.command('POST', '/goog/cdp/execute', {
            'cmd': command, 'params': params,
        })

    def element(self, selector):
        return self.command('POST', '/element', {
            'using': 'css selector', 'value': selector,
        })[ELEMENT]

    def click(self, selector):
        element = self.element(selector)
        self.command('POST', f'/element/{element}/click', {})

    def type_prompt(self, text):
        element = self.element('#form-prompt')
        self.command('POST', f'/element/{element}/clear', {})
        self.command('POST', f'/element/{element}/value', {'text': text})

    def prompt(self):
        return self.js("return document.querySelector('#form-prompt').value")

    def notices(self, role):
        return self.js(
            "return [...document.querySelectorAll('#create-form [role=' + arguments[0] + ']')].map(el => el.innerText.trim()).filter(Boolean)",
            role,
        )

    def posts(self):
        logs = self.command('POST', '/log', {'type': 'performance'})
        requests = []
        for entry in logs:
            event = json.loads(entry['message'])['message']
            if event['method'] == 'Network.requestWillBeSent':
                request = event['params']['request']
                if request['method'] == 'POST' and '/form/generate' in request['url']:
                    requests.append(request)
        return requests

    def network(self, offline=False, latency=0):
        self.cdp('Network.emulateNetworkConditions', offline=offline,
                 latency=latency, downloadThroughput=-1, uploadThroughput=-1)

    def screenshot(self, name):
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        encoded = self.command('GET', '/screenshot')
        (ARTIFACTS / f'{name}.png').write_bytes(base64.b64decode(encoded))

    def close(self):
        try:
            if self.session:
                self.command('DELETE', '')
        finally:
            self.process.terminate()
            self.process.wait(timeout=5)


def main():
    email = f'feedback-{uuid.uuid4().hex[:12]}@example.com'
    credentials = {'name': 'Feedback verification', 'email': email,
                   'password': 'FormoraFeedback1'}
    api_post('/auth/signup', credentials)
    auth = api_post('/auth/login', credentials)
    browser = Browser()
    try:
        browser.command('POST', '/url', {'url': APP_URL + '/login'})
        browser.js(
            "localStorage.setItem('auth-storage', JSON.stringify({state:{user:arguments[0]},version:0}));"
            "document.cookie='token='+arguments[1]+'; path=/; SameSite=Strict';",
            auth['data']['user'], auth['token'],
        )
        browser.command('POST', '/url', {'url': APP_URL + '/dashboard'})
        wait_for(lambda: browser.js("return !!document.querySelector('#form-prompt')"), 'prompt')
        wait_for(lambda: browser.js("return !document.body.innerText.includes('Loading your forms')"), 'forms list')
        browser.posts()
        assert browser.js("const r=document.querySelector('#create-form [role=status]'); return r && getComputedStyle(r).display!=='none' && getComputedStyle(r).visibility!=='hidden'"), 'The empty live region must remain exposed before its first message'

        browser.click('#create-form button[type=submit]')
        wait_for(lambda: len(browser.notices('alert')) == 1, 'validation alert')
        assert browser.js("return document.activeElement.id") == 'form-prompt', 'Validation must focus the prompt'
        assert browser.js("return document.querySelector('#form-prompt').getAttribute('aria-invalid')") == 'true', 'Validation must mark the prompt invalid'
        assert not browser.posts(), 'Validation sent a generation request'
        print('PASS validation is inline, focused, and sends no request')

        prompt = 'Create a short workshop registration form with name and email.'
        browser.type_prompt(prompt)
        assert not browser.notices('alert'), 'Editing did not clear validation'
        browser.network(latency=1000)
        browser.click('#create-form button[type=submit]')
        wait_for(lambda: browser.js("return !!document.querySelector('#create-form [aria-busy=true], #create-form[aria-busy=true]')"), 'pending state')
        assert browser.js("return document.querySelector('#form-prompt').readOnly"), 'Pending prompt must be readable and read-only'
        assert len(browser.notices('status')) == 1, 'Pending must have exactly one inline status'
        assert browser.js("return document.querySelector('#create-form button[type=submit]').disabled"), 'Pending must disable generation'
        browser.js("document.querySelector('#create-form form').requestSubmit(); document.querySelector('#create-form form').requestSubmit();")
        browser.cdp('Emulation.setEmulatedMedia', features=[{'name': 'prefers-reduced-motion', 'value': 'reduce'}])
        assert browser.js("const s=getComputedStyle(document.querySelector('#create-form .animate-spin')); return s.animationIterationCount==='1' && parseFloat(s.animationDuration)<=0.01"), 'Reduced motion must stop the continuous spinner'
        browser.cdp('Emulation.setEmulatedMedia', features=[])
        browser.screenshot('pending')
        wait_for(lambda: browser.js("return document.body.innerText.includes('Form generated successfully!')"), 'real generation success', timeout=40)
        assert browser.prompt() == '', 'Success must clear the prompt'
        generation_posts = browser.posts()
        assert len(generation_posts) == 1, 'Repeated submission created duplicate requests'
        assert json.loads(generation_posts[0]['postData'])['query'] == prompt, 'Generation sent a different prompt'
        assert browser.js("return [...document.querySelectorAll('[role=status]')].filter(el => el.innerText === 'Form generated successfully!').length") == 1, 'Success must have exactly one toast'
        browser.network()
        wait_for(lambda: browser.js("return !!document.querySelector('#your-forms tbody tr')"), 'generated form in the dashboard')
        time.sleep(0.4)
        browser.screenshot('success')
        print('PASS pending, duplicate submission guard, real generation success, and dashboard refresh')

        browser.type_prompt('Keep this prompt after a failed request.')
        browser.cdp('Network.setBlockedURLs', urls=['*/form/generate*'])
        browser.click('#create-form button[type=submit]')
        wait_for(lambda: len(browser.notices('alert')) == 1, 'network error alert')
        assert browser.prompt() == 'Keep this prompt after a failed request.', 'Failure lost the prompt'
        time.sleep(4.3)
        assert len(browser.notices('alert')) == 1, 'Request error disappeared before the user addressed it'
        assert not browser.js("return document.body.innerText.includes('Network error. Please check your connection.')"), 'Interceptor emitted a duplicate error toast'
        browser.screenshot('error')
        browser.posts()
        browser.type_prompt('Retry using the keyboard shortcut.')
        element = browser.element('#form-prompt')
        browser.command('POST', f'/element/{element}/value', {'text': '\ue009\ue007\ue000'})
        wait_for(lambda: len(browser.notices('alert')) == 1, 'keyboard-submitted request failure')
        assert len(browser.posts()) == 1, 'Keyboard shortcut must submit exactly one request'
        browser.type_prompt('Report a failure even after reconnecting.')
        browser.js("document.querySelector('#create-form form').requestSubmit(); window.dispatchEvent(new Event('offline')); window.dispatchEvent(new Event('online'));")
        wait_for(lambda: len(browser.notices('alert')) == 1, 'fresh failure after reconnection')
        assert not browser.notices('status'), 'Reconnect notice hid a fresh request error'
        assert browser.prompt() == 'Report a failure even after reconnecting.', 'Reconnect failure lost the prompt'
        assert len(browser.posts()) == 1, 'Reconnect failure check must submit exactly one request'
        browser.cdp('Network.setBlockedURLs', urls=[])
        print('PASS persistent request errors, prompt preservation, and keyboard submission without duplicate toasts')

        browser.type_prompt('Keep writing while offline.')
        browser.network(offline=True)
        wait_for(lambda: 'offline' in ' '.join(browser.notices('status')).lower(), 'offline status')
        assert browser.js("return document.querySelector('#create-form button[type=submit]').disabled"), 'Offline must disable generation'
        browser.js("document.querySelector('#create-form form').requestSubmit()")
        assert not browser.posts(), 'Offline submission sent a request'
        assert browser.prompt() == 'Keep writing while offline.', 'Offline state lost the prompt'
        browser.screenshot('offline')
        browser.network()
        wait_for(lambda: 'back online' in ' '.join(browser.notices('status')).lower(), 'reconnect status')
        assert not browser.posts(), 'Reconnect retried generation automatically'
        assert browser.prompt() == 'Keep writing while offline.', 'Reconnect lost the prompt'
        browser.type_prompt('A revised prompt after reconnect.')
        assert not browser.notices('status'), 'Editing did not acknowledge reconnect'
        print('PASS offline blocks requests and reconnect preserves work without automatic retry')

        browser.cdp('Emulation.setEmulatedMedia', features=[{'name': 'prefers-reduced-motion', 'value': 'reduce'}])
        browser.cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
        browser.js("document.documentElement.classList.add('dark')")
        browser.network(offline=True)
        wait_for(lambda: 'offline' in ' '.join(browser.notices('status')).lower(), 'mobile offline status')
        assert browser.js("return document.documentElement.scrollWidth <= innerWidth"), 'Mobile layout overflows horizontally'
        assert browser.js("const r=document.querySelector('#create-form button[type=submit]').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight"), 'Mobile submit control is outside viewport'
        browser.screenshot('offline-mobile-dark-reduced-motion')
        print('PASS mobile dark-mode status and submit remain visible with reduced motion')
        print(f'Screenshots saved to {ARTIFACTS}')
    except Exception:
        browser.screenshot('failure')
        print('Visible prompt feedback:', browser.js("return document.querySelector('#create-form')?.innerText"))
        raise
    finally:
        browser.close()


if __name__ == '__main__':
    main()
