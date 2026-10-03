import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import access from '../netlify/edge-functions/access.js';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.wasm':'application/wasm', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf' };

export async function staticResponse(request) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url).pathname); }
  catch { return new Response('Invalid path.', { status: 400 }); }
  const file = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) return new Response('Not found.', { status: 404 });
  try {
    if (!(await stat(file)).isFile()) return new Response('Not found.', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : await readFile(file), { headers: { 'Content-Type': types[extname(file)] || 'application/octet-stream' } });
  } catch { return new Response('Not found.', { status: 404 }); }
}

export function startPreview(port = Number(process.env.PORT || 5182)) {
  globalThis.Netlify = { env: { get: key => process.env[key] } };
  const server = createServer(async (incoming, outgoing) => {
    try {
      const options = { method: incoming.method, headers: incoming.headers };
      if (!['GET', 'HEAD'].includes(incoming.method)) Object.assign(options, { body: incoming, duplex: 'half' });
      const request = new Request(`http://${incoming.headers.host}${incoming.url}`, options);
      const response = await access(request, { ip: incoming.socket.remoteAddress, next: () => staticResponse(request) });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(incoming.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
    } catch {
      outgoing.writeHead(503); outgoing.end('Preview unavailable.');
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Protected local preview: http://127.0.0.1:${server.address().port}/`));
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startPreview();
