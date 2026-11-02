import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';
import { once } from 'node:events';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { formService } = await import('../src/services/formService.ts');
const { api } = await import('../src/lib/api.ts');
let response = { status: 200, body: {}, delay: 0, disconnect: false };
let requests = 0;
const server = createServer(async (request, reply) => {
  requests += 1;
  assert.equal(request.url, '/form/generate');
  assert.equal(request.method, 'POST');
  let body = '';
  for await (const chunk of request) body += chunk;
  assert.deepEqual(JSON.parse(body), { query: 'A feedback form' });
  if (response.disconnect) {
    request.socket.destroy();
    return;
  }
  const current = response;
  const send = () => {
    reply.writeHead(current.status, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify(current.body));
  };
  if (current.delay) setTimeout(send, current.delay);
  else send();
});

server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert.ok(address && typeof address !== 'string');
api.defaults.baseURL = `http://127.0.0.1:${address.port}`;
api.defaults.proxy = false;

async function check(name, settings, expected) {
  response = { status: 200, body: {}, delay: 0, disconnect: false, ...settings };
  const previous = requests;
  assert.deepEqual(await formService.generateForm({ query: 'A feedback form' }), expected, name);
  assert.equal(requests, previous + 1, `${name} must not retry automatically`);
  console.log(`PASS ${name}`);
}

try {
  await check('valid success envelope', {
    body: { success: true, message: 'Form generated successfully', data: { formName: 'Feedback' } },
  }, { ok: true });
  await check('HTTP 500', { status: 500, body: { error: 'Failed to generate form' } }, { ok: false, error: 'request' });
  await check('HTTP 401 remains a session outcome', { status: 401 }, { ok: false, error: 'session' });
  await check('unsuccessful HTTP 200', { body: { success: false, data: {} } }, { ok: false, error: 'request' });
  await check('invalid success payload', { body: { success: true, message: 'Created', data: null } }, { ok: false, error: 'request' });
  await check('connection loss', { disconnect: true }, { ok: false, error: 'network' });
  api.defaults.timeout = 50;
  await check('timeout remains distinct from network failure', { delay: 250 }, { ok: false, error: 'timeout' });
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
