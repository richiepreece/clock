export function prepareImportMap(map: { imports: Record<string, string> }, development: boolean) {
  if (!development) return map;

  return {
    ...map,
    imports: Object.fromEntries(Object.entries(map.imports).map(([name, url]) => [
      name,
      // esm.sh encodes query options in the path for import-map prefixes.
      name.endsWith('/')
        ? `${url.slice(0, -1)}&dev/`
        : `${url}${url.includes('?') ? '&' : '?'}dev`,
    ])),
  };
}
