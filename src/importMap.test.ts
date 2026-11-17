import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareImportMap } from './importMap.ts';

const map = JSON.parse(readFileSync(new URL('./import-map.json', import.meta.url), 'utf8'));

test('development import maps select matching development builds and preserve externals and subpaths', () => {
  const source = structuredClone(map);
  const { imports } = prepareImportMap(map, true);
  for (const [name, url] of Object.entries(imports)) {
    if (name.endsWith('/')) {
      assert.ok(url.endsWith('&dev/'), `development prefix for ${name}`);
      assert.equal(new URL('jsx-runtime', url).href, `${source.imports[name].slice(0, -1)}&dev/jsx-runtime`);
    } else {
      const parsed = new URL(url);
      assert.ok(parsed.searchParams.has('dev'), `development build for ${name}`);
      parsed.searchParams.delete('dev');
      assert.equal(parsed.searchParams.get('external'), new URL(source.imports[name]).searchParams.get('external'));
      assert.equal(parsed.pathname, new URL(source.imports[name]).pathname);
    }
  }
  assert.deepEqual(map, source, 'Preparing a development map must not modify the source map');
});

test('production import maps retain the source production URLs', () => {
  assert.deepEqual(prepareImportMap(map, false), map);
});

test('generation discovers runtime dependencies and follows installed versions rather than manifest ranges', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clock-import-map-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'src'));
    await mkdir(join(root, 'node_modules', 'example'), { recursive: true });
    await copyFile(
      new URL('../scripts/generate-import-map.mjs', import.meta.url),
      join(root, 'scripts', 'generate-import-map.mjs'),
    );
    await writeFile(join(root, 'package.json'), JSON.stringify({
      dependencies: { example: '^1.0.0' },
      devDependencies: { 'build-tool': '^2.0.0' },
    }));
    await writeFile(join(root, 'node_modules', 'example', 'index.js'), '');

    for (const version of ['1.2.3', '1.3.0']) {
      await writeFile(join(root, 'node_modules', 'example', 'package.json'), JSON.stringify({ name: 'example', version }));
      execFileSync(process.execPath, [join(root, 'scripts', 'generate-import-map.mjs')]);
      const { imports } = JSON.parse(await readFile(join(root, 'src', 'import-map.json'), 'utf8'));
      assert.deepEqual(Object.keys(imports), ['example', 'example/']);
      assert.equal(new URL(imports.example).pathname, `/example@${version}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
