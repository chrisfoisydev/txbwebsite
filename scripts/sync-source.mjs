import { cp, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'source/.next-production');
await stat(resolve(output, 'index.html'));
await mkdir(resolve(root, 'site/app'), { recursive: true });
await cp(output, resolve(root, 'site'), { recursive: true });
await cp(resolve(root, 'source/build/flutter-shell.html'), resolve(root, 'site/app/index.html'));
await import('./verify.mjs');
