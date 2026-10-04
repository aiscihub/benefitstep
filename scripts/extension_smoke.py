"""Isolated Chrome DevTools pipe helper for BenefitStep browser tests."""
import json, os, select, shutil, subprocess, time

class Pipe:
    def __init__(self, chrome, profile, netlog):
        r_in, self.w = os.pipe()
        self.r, w_out = os.pipe()

        def pre():
            os.dup2(r_in, 3)
            os.dup2(w_out, 4)
        self.proc = subprocess.Popen(
            [chrome, '--headless=new', '--remote-debugging-pipe', '--enable-unsafe-extension-debugging',
             '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
             '--disable-component-update', '--disable-sync', '--disable-default-apps', '--metrics-recording-only',
             f'--user-data-dir={profile}', f'--log-net-log={netlog}', '--net-log-capture-mode=Default', 'about:blank'],
            preexec_fn=pre, close_fds=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.close(r_in)
        os.close(w_out)
        self.buf = b''
        self.next_id = 0
        self.events = []

    def send(self, method, params=None, session=None):
        self.next_id += 1
        msg = {'id': self.next_id, 'method': method, 'params': params or {}}
        if session:
            msg['sessionId'] = session
        os.write(self.w, json.dumps(msg).encode() + b'\0')
        return self.next_id

    def call(self, method, params=None, session=None, timeout=20):
        want = self.send(method, params, session)
        end = time.time() + timeout
        while time.time() < end:
            while b'\0' in self.buf:
                raw, self.buf = self.buf.split(b'\0', 1)
                m = json.loads(raw)
                if m.get('method') == 'Target.attachedToTarget' and m['params'].get('waitingForDebugger'):
                    # A new worker: start watching it before it runs any code.
                    sid = m['params']['sessionId']
                    for method in ('Runtime.enable', 'Network.enable', 'Runtime.runIfWaitingForDebugger'):
                        self.send(method, {}, sid)
                if m.get('id') == want:
                    if 'error' in m:
                        raise RuntimeError(f"{method}: {m['error'].get('message')}")
                    return m.get('result', {})
                self.events.append(m)
            ready, _, _ = select.select([self.r], [], [], 0.2)
            if ready:
                chunk = os.read(self.r, 1 << 20)
                if not chunk:
                    break
                self.buf += chunk
        raise RuntimeError(f'{method}: no reply')

    def close(self):
        try:
            self.call('Browser.close', timeout=5)
        except Exception:
            pass
        try:
            self.proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait()


def find_chrome():
    for c in [os.environ.get('CHROME'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              shutil.which('google-chrome'), shutil.which('chromium')]:
        if c and os.path.exists(c):
            return c
    return None


