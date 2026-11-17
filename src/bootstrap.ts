import { prepareImportMap } from './importMap';

async function start() {
  const response = await fetch(new URL('raw:./import-map.json', import.meta.url));
  if (!response.ok) throw new Error(`Unable to load import map: HTTP ${response.status}`);

  const map = prepareImportMap(await response.json(), process.env.NODE_ENV !== 'production');
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify(map);
  document.head.append(script);

  await import('./index');
}

start().catch(error => {
  console.error('Unable to start the clock', error);
  document.getElementById('app')!.textContent = 'Unable to load the clock. Please reload.';
});
