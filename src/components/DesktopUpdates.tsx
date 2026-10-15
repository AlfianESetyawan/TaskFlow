import { useEffect, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ArrowDownToLine, RefreshCw, X } from 'lucide-react';
import './desktop-updates.css';

type UpdateStatus = {
  revision: number;
  phase: 'idle' | 'checking' | 'latest' | 'downloading' | 'ready' | 'installing' | 'error';
  currentVersion: string;
  version: string | null;
  notes: string | null;
  downloaded: number;
  total: number | null;
  error: string | null;
};

function useDesktopUpdate() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    let stop: (() => void) | undefined;
    const accept = (next: UpdateStatus) => { if (active) setStatus(previous => !previous || next.revision >= previous.revision ? next : previous); };
    void listen<UpdateStatus>('taskflow:update', event => accept(event.payload)).then(unlisten => {
      if (!active) { unlisten(); return; }
      stop = unlisten;
      return invoke<UpdateStatus>('desktop_update_status').then(accept);
    }).catch(error => { if (active) setError(String(error)); });
    return () => { active = false; stop?.(); };
  }, []);
  async function run(command: 'check_desktop_update' | 'install_desktop_update') {
    setError('');
    try { await invoke(command); } catch (error) { setError(String(error)); }
  }
  return { status, error, check: () => void run('check_desktop_update'), install: () => void run('install_desktop_update') };
}

function updateText(status: UpdateStatus): string {
  if (status.phase === 'checking') return 'Checking for updates...';
  if (status.phase === 'downloading') return `Downloading TaskFlow ${status.version}`;
  if (status.phase === 'ready') return `TaskFlow ${status.version} is ready`;
  if (status.phase === 'installing') return 'Installing update. TaskFlow will restart.';
  if (status.phase === 'error') return 'Could not check or download the update.';
  if (status.phase === 'latest') return 'You are up to date.';
  return 'Updates download automatically when available.';
}

function DownloadProgress({ status }: { status: UpdateStatus }) {
  const percent = status.total ? Math.min(100, Math.round(status.downloaded / status.total * 100)) : undefined;
  return <div className="desktop-update-download"><progress max={100} value={percent} aria-label="Update download progress"/><span>{percent === undefined ? `${(status.downloaded / 1048576).toFixed(1)} MB` : `${percent}%`}</span></div>;
}

export function DesktopUpdateNotice({ compact = false }: { compact?: boolean }) {
  const { status, error, check, install } = useDesktopUpdate();
  const [dismissed, setDismissed] = useState<string | null>(null);
  if (!isTauri() || !status) return null;
  const key = `${status.phase}:${status.version}:${status.error || ''}`;
  if (!['downloading', 'ready', 'installing', 'error'].includes(status.phase) || dismissed === key) return null;
  return <aside className={`desktop-update-notice ${compact ? 'is-widget' : ''}`} aria-label="App update">
    <div className="desktop-update-title"><ArrowDownToLine size={16}/><strong role="status">{updateText(status)}</strong>{status.phase !== 'installing' && <button onClick={() => setDismissed(key)} aria-label="Dismiss update notice"><X size={15}/></button>}</div>
    {status.phase === 'downloading' && <DownloadProgress status={status}/>}
    {status.phase === 'ready' && <><p>{status.error ? 'Installation did not finish. You can try again.' : 'Install whenever you are ready. The app will close and restart.'}</p><button className="btn btn-primary" onClick={install}>Install and restart</button></>}
    {status.phase === 'error' && <button className="btn btn-soft" onClick={check}><RefreshCw size={13}/>Retry</button>}
    {error && <p role="alert">{error}</p>}
  </aside>;
}

export function DesktopUpdateSettings() {
  const { status, error, check, install } = useDesktopUpdate();
  if (!isTauri()) return null;
  const busy = !status || ['checking', 'downloading', 'installing'].includes(status.phase);
  return <section className="card desktop-update-settings"><h2>App updates</h2><p>TaskFlow {status?.currentVersion || ''}. Checks at startup and hourly. New versions download automatically; you choose when to install.</p><strong role="status">{status ? updateText(status) : 'Loading update status...'}</strong>
    {status?.phase === 'downloading' && <DownloadProgress status={status}/>}
    {status?.notes && <details><summary>Release notes</summary><p className="desktop-update-notes">{status.notes}</p></details>}
    {(status?.error || error) && <p className="desktop-update-error" role="alert">{error || status?.error}</p>}
    <button className="btn btn-primary" disabled={busy} onClick={status?.phase === 'ready' ? install : check}>{status?.phase === 'ready' ? 'Install and restart' : busy ? 'Please wait...' : 'Check for updates'}</button>
  </section>;
}
