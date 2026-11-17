import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, parse } from 'node:path';

const root = new URL('../', import.meta.url);
const require = createRequire(new URL('package.json', root));
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const dependencies = Object.keys(pkg.dependencies).sort();
const external = dependencies.join(',');
const prefixExternal = dependencies.filter(name => !name.startsWith('@')).join(',');
const imports = {};

for (const name of dependencies) {
  let directory = dirname(require.resolve(name));
  let version;
  while (directory !== parse(directory).root) {
    try {
      const installed = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (installed.name === name) {
        version = installed.version;
        break;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    directory = dirname(directory);
  }
  if (!version) throw new Error(`Cannot determine the installed version of ${name}. Run pnpm install.`);

  const url = `https://esm.sh/${name}@${version}`;
  imports[name] = `${url}?external=${external}`;
  // esm.sh's prefix query syntax cannot contain scoped package paths.
  if (!name.startsWith('@')) imports[`${name}/`] = `${url}&external=${prefixExternal}/`;
}

await writeFile(new URL('src/import-map.json', root), `${JSON.stringify({ imports }, null, 2)}\n`);
