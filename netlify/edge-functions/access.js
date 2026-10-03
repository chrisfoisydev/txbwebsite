import { authorize, privateResponse } from '../lib/site-access.mjs';

function secure(response) {
  const result = privateResponse(response);
  result.headers.set('CDN-Cache-Control', 'no-store');
  result.headers.set('Netlify-CDN-Cache-Control', 'no-store');
  result.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return result;
}

export default async function access(request, context) {
  try {
    const env = {
      SITE_PASSWORD_HASH: Netlify.env.get('SITE_PASSWORD_HASH'),
      SITE_SESSION_SECRET: Netlify.env.get('SITE_SESSION_SECRET'),
    };
    // Use Netlify's trusted client IP, overriding any client-supplied header.
    const headers = new Headers(request.headers);
    headers.set('cf-connecting-ip', context.ip || 'unknown');
    const blocked = await authorize(new Request(request, { headers }), env);
    if (blocked) return secure(blocked);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return secure(new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD' } }));
    }
    const url = new URL(request.url);
    if (url.pathname === '/app' || url.pathname === '/app/flutter') {
      return secure(new Response(null, { status: 308, headers: { Location: `${url.pathname}/${url.search}` } }));
    }
    // Stream the published files only after checking the signed session.
    const response = secure(await context.next());
    if (url.pathname.startsWith('/app/flutter/') && response.headers.get('content-type')?.startsWith('text/html')) {
      response.headers.set('Content-Security-Policy', "connect-src 'self' https://www.gstatic.com https://fonts.gstatic.com; frame-ancestors 'self'; form-action 'none'");
    }
    return response;
  } catch {
    // Authentication failures must never fall through to public static files.
    return secure(new Response('The private preview is temporarily unavailable.', { status: 503 }));
  }
}

export const config = { onError: 'fail' };
