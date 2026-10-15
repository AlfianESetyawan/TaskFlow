import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'win32') throw new Error('This release script builds the Windows x64 installer.');
const host = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
if (host.status !== 0 || !/^host: x86_64-pc-windows-msvc$/m.test(host.stdout || '')) throw new Error('Use the Windows x64 MSVC Rust toolchain for this release script.');
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (config.version !== pkg.version) throw new Error('Release versions do not match.');
const key = process.env.TAURI_SIGNING_PRIVATE_KEY || join(homedir(), '.tauri', 'taskflow.key');
if (!process.env.TAURI_SIGNING_PRIVATE_KEY && !existsSync(key)) throw new Error(`Missing signing key: ${key}`);
if (existsSync(`${key}.pub`) && readFileSync(`${key}.pub`, 'utf8').trim() !== config.plugins.updater.pubkey) {
  throw new Error('Signing key does not match the public key trusted by installed apps.');
}
const env = { ...process.env, TAURI_SIGNING_PRIVATE_KEY: key, TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || '' };
const result = spawnSync(process.execPath, [resolve('node_modules/@tauri-apps/cli/tauri.js'), 'build'], { stdio: 'inherit', env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const name = `TaskFlow_${config.version}_x64-setup.exe`;
const dir = 'src-tauri/target/release/bundle/nsis';
const signature = readFileSync(`${dir}/${name}.sig`, 'utf8').trim();
const manifest = {
  version: config.version,
  notes: readFileSync('RELEASE_NOTES.md', 'utf8').trim(),
  pub_date: new Date().toISOString(),
  platforms: { 'windows-x86_64': { signature, url: `https://github.com/AlfianESetyawan/TaskFlow/releases/download/v${config.version}/${name}` } },
};
writeFileSync(`${dir}/latest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
const verify = spawnSync('cargo', ['run', '--release', '--manifest-path', 'src-tauri/Cargo.toml', '--example', 'verify_update', '--', `${dir}/latest.json`, `${dir}/${name}`], { stdio: 'inherit' });
if (verify.error) throw verify.error;
if (verify.status !== 0) process.exit(verify.status || 1);
console.log(`Signed installer and latest.json ready in ${dir}`);
