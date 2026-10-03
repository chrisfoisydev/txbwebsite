import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import access, { config } from '../netlify/edge-functions/access.js';
import { staticResponse } from '../scripts/preview.mjs';

const password = 'adapter-test-password';
const salt = randomBytes(16);
const env = { SITE_PASSWORD_HASH:`pbkdf2:100000:${salt.toString('hex')}:${pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex')}`, SITE_SESSION_SECRET:randomBytes(32).toString('hex') };
globalThis.Netlify = { env: { get: key => env[key] } };
const origin = 'https://preview.example';
let nextCalls = 0;
async function request(path, options = {}, ip = 'adapter-tests') {
  const req = new Request(origin + path, options);
  return access(req, { ip, next: () => { nextCalls++; return staticResponse(req); } });
}
function loginOptions(value = password, address = 'spoofed') {
  return { method:'POST', headers:{ Origin:origin, 'Content-Type':'application/x-www-form-urlencoded', 'cf-connecting-ip':address }, body:new URLSearchParams({ password:value, returnTo:'/app/' }) };
}
let cookie;
test('every route is protected and edge errors fail closed', async () => {
  assert.deepEqual(config, { onError:'fail' });
  assert.match(await readFile(new URL('../netlify.toml', import.meta.url), 'utf8'), /\[\[edge_functions\]\]\s+function = "access"\s+path = "\/\*"/);
});
test('unauthenticated Flutter, image and script requests never reach static files', async () => {
  nextCalls = 0;
  for (const path of ['/app/flutter/main.dart.js', '/app/flutter/assets/AssetManifest.bin.json', '/becu/new-member.png', '/_next/static/test.js']) {
    assert.equal((await request(path)).status, 401);
  }
  for (const path of ['/', '/app/', '/app/flutter/']) {
    const response = await request(path, { headers:{ Accept:'text/html' } });
    assert.match(await response.text(), /PRIVATE PREVIEW/);
  }
  assert.equal(nextCalls, 0);
});
test('password unlocks the website, responsive shell and complete Flutter build', async () => {
  const login = await request('/__access/login', loginOptions());
  assert.equal(login.status, 303);
  assert.equal(login.headers.get('location'), '/app/');
  cookie = login.headers.get('set-cookie').split(';')[0];
  for (const [path, type] of [['/','text/html'], ['/app/','text/html'], ['/app/flutter/','text/html'], ['/app/flutter/main.dart.js','text/javascript'], ['/app/flutter/assets/AssetManifest.bin.json','application/json'], ['/becu/new-member.png','image/png']]) {
    const response = await request(path, { headers:{ Cookie:cookie } });
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.equal(response.headers.get('netlify-cdn-cache-control'), 'no-store');
    if (path === '/app/') assert.match(await response.text(), /This is actual treXis source code/);
    if (path === '/app/flutter/') assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'self'/);
    if (path.endsWith('main.dart.js')) assert.ok((await response.arrayBuffer()).byteLength > 20000000);
  }
});
test('redirects preserve queries; HEAD and missing files have correct responses', async () => {
  for (const path of ['/app', '/app/flutter']) {
    const response = await request(`${path}?demo=1`, { headers:{ Cookie:cookie } });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), `${path}/?demo=1`);
  }
  const head = await request('/app/flutter/main.dart.js', { method:'HEAD', headers:{ Cookie:cookie } });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal((await request('/missing-file', { headers:{ Cookie:cookie } })).status, 404);
  for (const path of ['/netlify.env', '/source/package.json', '/netlify/lib/site-access.mjs']) assert.equal((await request(path, { headers:{ Cookie:cookie } })).status, 404);
});
test('trusted Netlify IP controls backoff, not forged request headers', async () => {
  for (let i = 0; i < 8; i++) assert.equal((await request('/__access/login', loginOptions('wrong', `fake-${i}`), 'rate-limited-client')).status, 401);
  assert.equal((await request('/__access/login', loginOptions(password, 'new-fake'), 'rate-limited-client')).status, 429);
  assert.equal((await request('/__access/login', loginOptions(password), 'different-client')).status, 303);
});
test('missing configuration and runtime failures never pass through', async () => {
  const before = nextCalls;
  const get = globalThis.Netlify.env.get;
  globalThis.Netlify.env.get = () => undefined;
  assert.equal((await request('/app/flutter/main.dart.js', { headers:{ Cookie:cookie } })).status, 503);
  globalThis.Netlify.env.get = () => { throw new Error('environment unavailable'); };
  assert.equal((await request('/')).status, 503);
  globalThis.Netlify.env.get = get;
  assert.equal(nextCalls, before);
});
