import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const repo = 'AlfianESetyawan/TaskFlow';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const dir = 'src-tauri/target/release/bundle/nsis';
const name = `TaskFlow_${version}_x64-setup.exe`;
const manifest = JSON.parse(readFileSync(`${dir}/latest.json`, 'utf8'));
if (manifest.version !== version || manifest.platforms['windows-x86_64'].signature !== readFileSync(`${dir}/${name}.sig`, 'utf8').trim()) throw new Error('Release metadata is stale. Rebuild first.');
if (manifest.notes !== readFileSync('RELEASE_NOTES.md', 'utf8').trim() || manifest.platforms['windows-x86_64'].url !== `https://github.com/${repo}/releases/download/v${version}/${name}`) throw new Error('Release notes or download URL are stale. Rebuild first.');
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Commit release changes before publishing.');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const remote = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8' }).split(/\s/)[0];
if (remote !== commit) throw new Error('Push the release commit to origin/main before publishing.');
const gitFile = path => execFileSync('git', ['show', `${commit}:${path}`], { encoding: 'utf8' }).trim();
if (JSON.parse(gitFile('package.json')).version !== version) throw new Error('Release commit has a different version.');
execFileSync('cargo', ['run', '--release', '--manifest-path', 'src-tauri/Cargo.toml', '--example', 'verify_update', '--', `${dir}/latest.json`, `${dir}/${name}`], { stdio: 'inherit' });
console.log(`Publishing ${version}; installer SHA256 ${createHash('sha256').update(readFileSync(`${dir}/${name}`)).digest('hex')}`);
// Draft first: latest.json becomes discoverable only after all three assets are uploaded.
execFileSync('gh', ['release', 'create', `v${version}`, `${dir}/${name}`, `${dir}/${name}.sig`, `${dir}/latest.json`, '--repo', repo, '--target', commit, '--title', `TaskFlow ${version}`, '--notes-file', 'RELEASE_NOTES.md', '--draft'], { stdio: 'inherit' });
execFileSync('gh', ['release', 'edit', `v${version}`, '--repo', repo, '--draft=false', '--latest'], { stdio: 'inherit' });
console.log(`Published TaskFlow ${version}. Deploy the web build with npx firebase-tools deploy --only hosting:app.`);
