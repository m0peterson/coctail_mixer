import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PUBLIC = join(import.meta.dirname, '..', 'public');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('сервис-воркер кэширует все JS-модули приложения', () => {
  const sw = readFileSync(join(PUBLIC, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  const modules = walk(join(PUBLIC, 'js')).map((p) => relative(PUBLIC, p).split('\\').join('/'));
  for (const m of modules) assert.ok(listed.has(m), `${m} нет в PRECACHE в sw.js`);
  for (const f of listed) {
    assert.doesNotThrow(() => statSync(join(PUBLIC, f)), `${f} из PRECACHE не существует`);
  }
});
