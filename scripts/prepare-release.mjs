import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('Usage: npm run release:prepare -- 1.2.7');
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const previous = pkg.version;
const config = readJson('src-tauri/tauri.conf.json');
if (config.version !== previous) throw new Error('Package and Tauri versions differ. Resolve before releasing.');
pkg.version = version;
writeFileSync('package.json', `${JSON.stringify(pkg)}\n`);
const lock = readJson('package-lock.json');
lock.version = version;
lock.packages[''].version = version;
writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
config.version = version;
writeFileSync('src-tauri/tauri.conf.json', `${JSON.stringify(config, null, 2)}\n`);
for (const path of ['src-tauri/Cargo.toml', 'src-tauri/Cargo.lock']) {
  const name = path.endsWith('.lock') ? 'taskflow-widget' : null;
  const source = readFileSync(path, 'utf8');
  const pattern = name ? /(name = "taskflow-widget"\r?\nversion = ")[^"]+/ : /(\[package\]\r?\nname = "taskflow-widget"\r?\nversion = ")[^"]+/;
  if (!pattern.test(source)) throw new Error(`Could not locate app version in ${path}`);
  writeFileSync(path, source.replace(pattern, `$1${version}`));
}
for (const path of ['src/download.ts', 'README.md']) {
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll(previous, version));
}
console.log(`TaskFlow ${previous} -> ${version}. Update RELEASE_NOTES.md, then run npm run release:build.`);
