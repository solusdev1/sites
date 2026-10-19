import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.action.default_popup, 'popup.html');
assert.deepEqual(manifest.permissions.sort(), ['activeTab','downloads','storage']);  // downloads: MP4 e último frame
assert.deepEqual(manifest.host_permissions, ['http://127.0.0.1:8765/*']);
const files = [manifest.action.default_popup, manifest.background.service_worker, ...manifest.content_scripts.flatMap(({js}) => js)];
const popup = readFileSync(resolve(root, manifest.action.default_popup), 'utf8');
for (const match of popup.matchAll(/(?:href|src)="([^"]+)"/g)) files.push(match[1]);
for (const file of files) assert.ok(existsSync(resolve(root, file)), `Arquivo ausente: ${file}`);
assert.ok(manifest.content_scripts.some(({matches}) => matches.some(m => m.startsWith('https://labs.google/fx/tools/flow'))));
assert.ok(manifest.content_scripts.some(({matches}) => matches.includes('https://flow.google.com/*')));
assert.ok(manifest.content_scripts.some(({matches}) => matches.includes('https://gemini.google.com/*')));
console.log('Manifest MV3 válido; arquivos e escopos conferidos.');
