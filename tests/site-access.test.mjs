import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync, randomBytes, createHmac } from 'node:crypto';
import { authorize, hasSession } from '../netlify/lib/site-access.mjs';

const password = 'Example-test-password-42';
const salt = randomBytes(16);
const env = { SITE_PASSWORD_HASH: `pbkdf2:100000:${salt.toString('hex')}:${pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex')}`, SITE_SESSION_SECRET: randomBytes(32).toString('hex') };
let address = 0;
function login(value, returnTo = '/', extra = {}) {
  return new Request('https://preview.example/__access/login', { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': `test-${++address}`, ...extra }, body: new URLSearchParams({ password: value, returnTo }) });
}

test('locked root reveals the gate only, not the presentation', async () => {
  const response = await authorize(new Request('https://preview.example/'), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /PRIVATE PREVIEW/);
  assert.match(response.headers.get('cache-control'), /no-store/);
});
test('direct assets, JavaScript and RSC requests require a session', async () => {
  for (const path of ['/becu/new-member.png', '/_next/static/chunks/page.js', '/index.txt', '/?__rsc=1']) {
    const response = await authorize(new Request(`https://preview.example${path}`, { headers: { Accept: 'text/x-component' } }), env);
    if (path.startsWith('/?')) assert.match(await response.text(), /PRIVATE PREVIEW/);
    else assert.equal(response.status, 401);
  }
});
test('wrong passwords are rejected and not echoed', async () => {
  const response = await authorize(login('wrong-example-value'), env);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
  const body = await response.text();
  assert.match(body, /isn’t correct/);
  assert.ok(!body.includes('wrong-example-value'));
  assert.ok(!body.includes(env.SITE_PASSWORD_HASH));
});
test('valid password creates a signed, eight-hour HttpOnly secure session', async () => {
  const response = await authorize(login(password, '/#members'), env);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/#members');
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /Secure/); assert.match(setCookie, /SameSite=Strict/); assert.match(setCookie, /Max-Age=28800/);
  const request = new Request('https://preview.example/becu/new-member.png', { headers: { Cookie: setCookie.split(';')[0] } });
  assert.equal(await hasSession(request, env), true);
  assert.equal(await authorize(request, env), null);
});
test('forged, expired, overlong and rotated sessions fail', async () => {
  const valid = (await authorize(login(password), env)).headers.get('set-cookie').split(';')[0];
  assert.equal(await hasSession(new Request('https://preview.example', { headers: { Cookie: valid + '0' } }), env), false);
  assert.equal(await hasSession(new Request('https://preview.example', { headers: { Cookie: valid } }), { ...env, SITE_SESSION_SECRET: randomBytes(32).toString('hex') }), false);
  for (const expiry of [Math.floor(Date.now()/1000)-60, Math.floor(Date.now()/1000)+999999]) {
    const payload = `${expiry}.${randomBytes(16).toString('hex')}`;
    const sig = createHmac('sha256', env.SITE_SESSION_SECRET).update(payload).digest('hex');
    assert.equal(await hasSession(new Request('https://preview.example', { headers: { Cookie: `becu_site_access=${payload}.${sig}` } }), env), false);
  }
});
test('cross-origin submissions and external redirects are rejected', async () => {
  assert.equal((await authorize(login(password, '/', { Origin: 'https://attacker.example' }), env)).status, 403);
  for (const path of ['https://attacker.example', '//attacker.example', '/\\attacker.example']) {
    assert.equal((await authorize(login(password, path), env)).headers.get('location'), '/');
  }
});
test('logout clears the cookie and rejects cross-origin requests', async () => {
  const response = await authorize(new Request('https://preview.example/__access/logout', { method: 'POST', headers: { Origin: 'https://preview.example' } }), env);
  assert.equal(response.status, 303); assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await authorize(new Request('https://preview.example/__access/logout', { method: 'POST' }), env)).status, 403);
});
test('missing runtime secrets fail closed', async () => {
  assert.equal((await authorize(new Request('https://preview.example/'), {})).status, 503);
});
test('large login forms are rejected and repeated failures back off', async () => {
  assert.equal((await authorize(login('x'.repeat(5000)), env)).status, 413);
  for (let i=0;i<8;i++) assert.equal((await authorize(login('wrong', '/', { 'cf-connecting-ip': 'rate-test' }), env)).status, 401);
  assert.equal((await authorize(login(password, '/', { 'cf-connecting-ip': 'rate-test' }), env)).status, 429);
});
