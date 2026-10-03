import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publish = resolve(root, 'site');
for (const file of ['index.html', 'app/index.html', 'app/flutter/index.html', 'app/flutter/flutter_bootstrap.js', 'app/flutter/main.dart.js', 'app/flutter/assets/AssetManifest.bin.json', 'becu/new-member.png', 'becu/resume-application.png', 'becu/safe-theme.png', 'becu/accounts-desktop-final.png']) {
  assert.ok((await stat(resolve(publish, file))).size > 0, `Missing/empty asset: ${file}`);
}
assert.match(await readFile(resolve(publish, 'app/flutter/index.html'), 'utf8'), /<base href="\/app\/flutter\/">/);
const shell = await readFile(resolve(publish, 'app/index.html'), 'utf8');
assert.ok(shell.includes('src="/app/flutter/"'));
assert.ok(shell.includes('This is actual treXis source code.'));
assert.ok(shell.includes('border-radius:20px'));
let count = 0, bytes = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    const name = relative(publish, file).replaceAll('\\', '/');
    assert.ok(!entry.isSymbolicLink(), `Symlink in publish output: ${name}`);
    assert.ok(!/(^|\/)(?:\.env[^/]*|netlify\.env|\.git|node_modules|netlify|source|work)(?:\/|$)/.test(name), `Private file in publish output: ${name}`);
    if (entry.isDirectory()) await check(file);
    else { count++; bytes += (await stat(file)).size; }
  }
}
await check(publish);
console.log(`Verified ${count} published files (${(bytes / 1048576).toFixed(1)} MiB), Flutter paths, phone shell, and private-file exclusions.`);
