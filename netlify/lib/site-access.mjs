import { logoData, trexisLogoData } from './site-access-logo.mjs';

const COOKIE = 'becu_site_access';
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const attempts = new Map();
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const unhex = value => Uint8Array.from(value.match(/.{2}/g) ?? [], b => parseInt(b, 16));

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function verifyPassword(password, encoded) {
  const [algorithm, rounds, salt, expected] = (encoded ?? '').split(':');
  if (algorithm !== 'pbkdf2' || rounds !== '100000' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{64}$/.test(expected ?? '')) return false;
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(salt), iterations: 100000 }, material, 256));
  const target = unhex(expected);
  let difference = 0;
  for (let i = 0; i < target.length; i++) difference |= target[i] ^ derived[i];
  return difference === 0;
}

export async function hasSession(request, env) {
  const cookie = (request.headers.get('cookie') ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`));
  if (!cookie || !env.SITE_SESSION_SECRET) return false;
  const value = cookie.slice(COOKIE.length + 1);
  const match = /^(\d{10,13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  if (expires <= now || expires > now + SESSION_SECONDS) return false;
  return crypto.subtle.verify('HMAC', await signingKey(env.SITE_SESSION_SECRET), unhex(match[3]), encoder.encode(`${match[1]}.${match[2]}`));
}

function escape(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function safeReturn(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value) || value.startsWith('/__access/')) return '/';
  try {
    const url = new URL(value, 'https://site.invalid');
    return url.origin === 'https://site.invalid' ? `${url.pathname}${url.search}${url.hash}` : '/';
  } catch { return '/'; }
}

function gatePage(returnTo = '/', error = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private preview · treXis × BECU</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f7f7f4;color:#002f36;font-family:Arial,Helvetica,sans-serif;min-height:100svh;display:grid;place-items:center;padding:36px 22px;background-image:radial-gradient(ellipse at 85% 25%,#e4eeec 0,transparent 52%)}
  body:before,body:after{content:'';position:fixed;width:46vw;height:72vh;border:1px solid #00343c14;transform:rotate(-13deg);right:-10vw;top:20vh;z-index:-1;pointer-events:none}body:after{right:-2vw;top:10vh;transform:rotate(9deg);border-color:#d8243414}
  main{width:min(100%,450px)}.brand{display:flex;align-items:center;gap:20px;margin-bottom:53px}.brand>span{font-size:29px;font-weight:600;letter-spacing:-1px}.brand b{color:#d82434}.brand i{font-style:normal;font-size:20px;color:#6d8185}.brand img{width:112px;height:auto}.eyebrow{font-size:10px;letter-spacing:2px;color:#526970;margin-bottom:18px;display:flex;align-items:center;gap:9px}.eyebrow:before{content:'';width:6px;height:6px;border-radius:50%;background:#d82434}h1{font-size:clamp(38px,7vw,52px);letter-spacing:-2px;line-height:1.07;font-weight:400;margin:0 0 20px}h1 span{color:#d82434}p{font-size:15px;line-height:1.7;color:#526970;margin:0 0 28px}form{margin-top:30px}label{display:block;font-size:12px;font-weight:600;margin-bottom:10px}input{display:block;width:100%;font:inherit;padding:15px 17px;border:1px solid #b8cacc;border-radius:10px;color:#002f36;background:#fff;min-height:52px}input:focus-visible,button:focus-visible{outline:2px solid #007f8c;outline-offset:4px}button{width:100%;display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding:16px 21px;border:0;border-radius:28px;background:#d82434;color:#fff;font-size:14px;cursor:pointer;box-shadow:0 10px 24px #d8243417}button:hover{background:#b71c2b}.error{color:#af1d2d;font-size:13px;line-height:1.5;margin:12px 0 0}.foot{display:block;margin-top:26px;color:#6d8185;font-size:11px;line-height:1.6}@media(max-height:650px){.brand{margin-bottom:30px}body{padding:25px 22px}h1{font-size:38px}form{margin-top:20px}}
  </style></head><body><main><div class="brand" aria-label="treXis and BECU"><img src="${trexisLogoData}" alt="treXis" width="540" height="171"><i>×</i><img src="${logoData}" alt="BECU" width="318" height="99"></div><div class="eyebrow">PRIVATE PREVIEW</div><h1>A closer look.<br><span>Built together.</span></h1><p>Enter your password to explore the BECU member experience.</p><form method="post" action="/__access/login"><input type="hidden" name="returnTo" value="${escape(safeReturn(returnTo))}"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" ${error ? 'aria-invalid="true" aria-describedby="password-error"' : ''}>${error ? `<p class="error" id="password-error" role="alert">${escape(error)}</p>` : ''}<button type="submit">Enter the experience <span aria-hidden="true">↗</span></button></form><small class="foot">Access stays unlocked in this browser for up to eight hours.</small></main></body></html>`;
}

function gate(returnTo, error, status = 200) {
  return new Response(gatePage(returnTo, error), { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'" } });
}

function cookie(value, request, age) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}

async function readSmallForm(request) {
  if (Number(request.headers.get('content-length')) > 4096) return null;
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

export async function authorize(request, env) {
  const url = new URL(request.url);
  if (!env.SITE_PASSWORD_HASH || (env.SITE_SESSION_SECRET ?? '').length < 32) {
    return new Response('Private preview is not configured. Please contact the site owner.', { status: 503, headers });
  }
  if (url.pathname === '/__access/login' || url.pathname === '/__access/logout') {
    if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405, headers: { ...headers, Allow: 'POST' } });
    if (request.headers.get('origin') !== url.origin) return new Response('Request not allowed.', { status: 403, headers });
    if (url.pathname === '/__access/logout') return new Response(null, { status: 303, headers: { ...headers, Location: '/', 'Set-Cookie': cookie('', request, 0) } });
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response('Unsupported form.', { status: 415, headers });
    const body = await readSmallForm(request);
    if (body === null) return new Response('Request too large.', { status: 413, headers });
    const form = new URLSearchParams(body);
    const returnTo = safeReturn(form.get('returnTo'));
    const password = form.get('password') ?? '';
    const now = Date.now();
    // A local/isolate-level backoff supplements the hosting platform's access controls.
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const address = request.headers.get('cf-connecting-ip') ?? 'local';
    const failures = attempts.get(address) ?? { count: 0, until: now + 15 * 60 * 1000 };
    if (failures.count >= 8) return gate(returnTo, 'Too many attempts. Please try again in 15 minutes.', 429);
    if (password.length > 256 || !await verifyPassword(password, env.SITE_PASSWORD_HASH)) {
      failures.count++;
      if (attempts.size < 10000 || attempts.has(address)) attempts.set(address, failures);
      return gate(returnTo, 'That password isn’t correct. Please try again.', 401);
    }
    attempts.delete(address);
    const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
    const signature = hex(new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(env.SITE_SESSION_SECRET), encoder.encode(payload))));
    return new Response(null, { status: 303, headers: { ...headers, Location: returnTo, 'Set-Cookie': cookie(`${payload}.${signature}`, request, SESSION_SECONDS) } });
  }
  if (await hasSession(request, env)) return null;
  if (request.method === 'GET' && (url.pathname === '/' || request.headers.get('accept')?.includes('text/html'))) return gate(`${url.pathname}${url.search}`);
  return new Response('Password required.', { status: 401, headers });
}

export function privateResponse(response) {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(headers)) secured.headers.set(name, value);
  return secured;
}
