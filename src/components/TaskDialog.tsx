import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { format } from 'date-fns';
import { AlignLeft, Archive, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Copy, ExternalLink, Flag, Folder, Gauge, ListChecks, Maximize2, Minimize2, Paperclip, Plus, Repeat2, Save, StickyNote, Trash2, X, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { blankTask, createTask, deleteTask, duplicateTask, taskProgress, updateTask } from '../services/data';
import { ensureNotificationPermission } from '../services/notifications';
import { priorities, statusLabels, statuses, type Priority, type Reference, type Status, type Task } from '../types';
import { Button, Confirm, dateLabel } from './ui';
import './task-dialog.css';

export const withoutId=(task:Task):Omit<Task,'id'>=>{const {id,...rest}=task;void id;return rest};

const referenceKey=(reference:Reference)=>reference.url.trim().toLowerCase();
export function availableReferences(tasks:Task[], selected:Reference[]):Reference[] {
  const used=new Set(selected.map(referenceKey));
  const unique=new Map<string,Reference>();
  for(const task of tasks)for(const reference of task.references||[]){
    const key=referenceKey(reference);
    if(key&&!used.has(key)&&!unique.has(key))unique.set(key,reference);
  }
  return [...unique.values()].sort((a,b)=>a.title.localeCompare(b.title));
}

function TaskModal({ children, wide, setWide, project, onClose, onSave, titleId, preventClose = false }: {
  children: ReactNode; wide: boolean; setWide: (wide: boolean) => void; project?: string;
  onClose: () => void; onSave?: () => void; titleId: string; preventClose?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const closeRef = useRef(onClose);
  const saveRef = useRef(onSave);
  closeRef.current = onClose;
  saveRef.current = onSave;
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    return () => { document.body.style.overflow = overflow; previousFocus.current?.focus(); };
  }, []);
  return <div className="modal-backdrop task-dialog-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget && !preventClose) onClose();
  }}>
    <section ref={ref} tabIndex={-1} className={`task-dialog ${wide ? 'is-wide' : 'is-compact'}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
      onKeyDown={e => {
        if (preventClose) return;
        if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && saveRef.current) { e.preventDefault(); saveRef.current(); }
        if (e.key === 'Tab') {
          const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length);
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }}>
      <header className="task-dialog-topbar">
        <div className="task-dialog-breadcrumb"><Zap size={15}/><span>TaskFlow</span><ChevronRight size={12}/><span className="task-dialog-project"><Folder size={12}/>{project || 'Personal tasks'}</span></div>
        <div className="task-dialog-window-actions">
          <button type="button" className="task-view-switch" onClick={() => setWide(!wide)} aria-label={wide ? 'Switch to compact view' : 'Switch to wide view'} aria-pressed={wide}>
            {wide ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}<span>{wide ? 'Compact' : 'Wide view'}</span>
          </button>
          <button type="button" className="task-dialog-close" onClick={onClose} aria-label="Close task dialog"><X size={18}/><kbd>Esc</kbd></button>
        </div>
      </header>
      {children}
    </section>
  </div>;
}

function SectionHeading({ icon, children, count }: { icon: ReactNode; children: ReactNode; count?: string | number }) {
  return <h3 className="task-section-heading">{icon}<span>{children}</span>{count !== undefined && <span className="task-section-count">{count}</span>}</h3>;
}

export function TaskEditor({ task, defaultDate, onClose }: { task?: Task; defaultDate?: string; onClose: () => void }) {
  const { user, projects, tasks, setError } = useApp();
  const [form, setForm] = useState<Omit<Task, 'id'>>(() => task ? { ...withoutId(task), progress: taskProgress(task) } : { ...blankTask(), deadline: defaultDate || '' });
  const [wide, setWide] = useState(true);
  const [busy, setBusy] = useState(false), [subtask, setSubtask] = useState(''), [refTitle, setRefTitle] = useState(''), [refUrl, setRefUrl] = useState('');
  const [selectedReference, setSelectedReference] = useState(''), [deleteOpen, setDeleteOpen] = useState(false), [saveError, setSaveError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const reusableReferences = availableReferences(tasks, form.references);
  const project = projects.find(p => p.id === form.projectId);
  const set = <K extends keyof Omit<Task, 'id'>>(key: K, value: Omit<Task, 'id'>[K]) => setForm(f => ({ ...f, [key]: value }));
  const setProgress = (progress: number) => setForm(f => ({ ...f, progress, status: progress === 100 ? 'done' : f.status === 'done' ? 'progress' : f.status }));
  const setStatus = (status: Status) => setForm(f => ({ ...f, status, progress: status === 'done' ? 100 : f.status === 'done' ? 0 : f.progress }));
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || busy) return;
    setBusy(true); setSaveError('');
    try {
      if (form.notificationAt && new Date(form.notificationAt).getTime() <= Date.now()) throw Error('Notification time must be in the future.');
      if (form.notificationAt && !await ensureNotificationPermission()) throw Error('Allow Windows notifications to save this reminder.');
      if (task) await updateTask(user!.uid, task, form);
      else await createTask(user!.uid, { ...form, title: form.title.trim() });
      onClose();
    } catch (e) { const message = (e as Error).message; setSaveError(message); setError(message); }
    finally { setBusy(false); }
  }
  function addSubtask() {
    if (!subtask.trim()) return;
    set('subtasks', [...form.subtasks, { id: crypto.randomUUID(), title: subtask.trim(), done: false }]); setSubtask('');
  }
  function addReference() {
    if (!refUrl.trim()) return;
    try {
      const url = new URL(refUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw Error();
      if (form.references.some(r => r.url.trim().toLowerCase() === url.toString().toLowerCase())) { setError('This reference is already on this task.'); return; }
      set('references', [...form.references, { id: crypto.randomUUID(), title: refTitle.trim() || url.hostname, url: url.toString(), type: 'Link' }]); setRefTitle(''); setRefUrl('');
    } catch { setError('Enter a valid http or https URL.'); }
  }
  return <TaskModal wide={wide} setWide={setWide} project={project?.name} onClose={onClose} titleId="task-editor-title" onSave={() => formRef.current?.requestSubmit()} preventClose={deleteOpen}>
    <form ref={formRef} className="task-dialog-form" onSubmit={save}>
      <div className="task-dialog-scroll">
        <div className="task-dialog-content">
          <div className="task-dialog-intro">
            <span className="task-dialog-eyebrow" id="task-editor-title">{task ? 'Edit task' : 'Create a task'}</span>
            <input className="task-title-input" aria-label="Task title" autoFocus required maxLength={300} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to get done?"/>
            <label className="task-project-picker"><span>in</span><select aria-label="Project" value={form.projectId} onChange={e => set('projectId', e.target.value)}><option value="">Personal tasks</option>{projects.filter(p => !p.archived || p.id === form.projectId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          </div>
          <div className="task-description-box"><label htmlFor="task-description"><AlignLeft size={15}/>Description<span>Task context</span></label><textarea id="task-description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Add context, details, or acceptance criteria..." rows={3}/></div>
          <section className="task-properties">
            <h3 className="task-properties-heading">Task properties</h3>
            <label><span><CheckCircle2 size={14}/>Status</span><select value={form.status} onChange={e => setStatus(e.target.value as Status)}>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
            <div className="task-property"><span id="task-priority-label"><Flag size={14}/>Priority</span><div className="task-priority-options" role="group" aria-labelledby="task-priority-label">{[...priorities].reverse().map(p => <button type="button" key={p} className={form.priority === p ? `selected priority-${p}` : ''} aria-pressed={form.priority === p} onClick={() => set('priority', p as Priority)}>{p === 'medium' ? 'Med' : p}</button>)}</div></div>
            <label><span><Gauge size={14}/>Progress <small>{form.progress}%</small></span><div className="progress-input"><input type="range" min={0} max={100} value={form.progress} onChange={e => setProgress(Number(e.target.value))} aria-label="Task progress"/><input type="number" min={0} max={100} value={form.progress} onChange={e => setProgress(Math.max(0, Math.min(100, Number(e.target.value))))} aria-label="Progress percent"/></div></label>
            <label><span><CalendarDays size={14}/>Deadline <small>Optional</small></span><input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}/></label>
            <label><span><CalendarDays size={14}/>Assigned date</span><input type="date" value={form.assignedDate} onChange={e => set('assignedDate', e.target.value)}/></label>
            <label><span><CalendarDays size={14}/>Start date</span><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}/></label>
            <label className="task-reminder-field"><span><Bell size={14}/>Notification <small>Windows app</small></span><input type="datetime-local" value={form.notificationAt ? format(new Date(form.notificationAt), "yyyy-MM-dd'T'HH:mm") : ''} onChange={e => set('notificationAt', e.target.value ? new Date(e.target.value).toISOString() : '')}/></label>
            <div className="task-recurrence-field"><label><span><Repeat2 size={14}/>Repeat</span><select value={form.recurrence.frequency} onChange={e => set('recurrence', { ...form.recurrence, frequency: e.target.value as typeof form.recurrence.frequency })}><option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom (days)</option></select></label>
              {form.recurrence.frequency !== 'none' && <div className="task-recurrence-options"><label>Every<input type="number" min={1} max={365} value={form.recurrence.interval} onChange={e => set('recurrence', { ...form.recurrence, interval: Math.max(1, Number(e.target.value)) })}/></label><label>End date<input type="date" value={form.recurrence.endDate} onChange={e => set('recurrence', { ...form.recurrence, endDate: e.target.value })}/></label><label className="check-label"><input type="checkbox" checked={form.recurrence.paused} onChange={e => set('recurrence', { ...form.recurrence, paused: e.target.checked })}/>Pause recurrence</label></div>}
            </div>
          </section>
          <section className="task-subtasks-section"><SectionHeading icon={<ListChecks size={16}/>} count={`${form.subtasks.filter(s => s.done).length}/${form.subtasks.length}`}>Subtasks</SectionHeading>
            <div className="task-subtask-list">{form.subtasks.map(s => <div className={`task-subtask-row ${s.done ? 'is-done' : ''}`} key={s.id}><input type="checkbox" aria-label={`Complete ${s.title}`} checked={s.done} onChange={e => set('subtasks', form.subtasks.map(x => x.id === s.id ? { ...x, done: e.target.checked } : x))}/><input aria-label="Subtask title" value={s.title} onChange={e => set('subtasks', form.subtasks.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))}/><button type="button" onClick={() => set('subtasks', form.subtasks.filter(x => x.id !== s.id))} aria-label={`Remove ${s.title}`}><X size={15}/></button></div>)}</div>
            <div className="task-add-subtask"><Plus size={16}/><input aria-label="New subtask" placeholder="Add a subtask and press Enter..." value={subtask} onChange={e => setSubtask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}/><button type="button" disabled={!subtask.trim()} onClick={addSubtask}>Add</button></div>
          </section>
          <section className="task-references-section"><SectionHeading icon={<Paperclip size={16}/>} count={form.references.length}>References & links</SectionHeading>
            <div className="task-reference-chips">{form.references.map(r => <div key={r.id}><ExternalLink size={14}/><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a><button type="button" onClick={() => set('references', form.references.filter(x => x.id !== r.id))} aria-label={`Remove ${r.title}`}><X size={13}/></button></div>)}</div>
            {reusableReferences.length > 0 && <div className="task-reference-reuse"><select aria-label="Existing reference" value={selectedReference} onChange={e => setSelectedReference(e.target.value)}><option value="">Browse existing references...</option>{reusableReferences.map(r => <option key={r.url.trim().toLowerCase()} value={r.url.trim().toLowerCase()}>{r.title} - {r.url}</option>)}</select><Button variant="soft" disabled={!selectedReference} onClick={() => { const reference = reusableReferences.find(r => r.url.trim().toLowerCase() === selectedReference); if (reference) { set('references', [...form.references, reference]); setSelectedReference(''); } }}>Use reference</Button></div>}
            <div className="task-reference-add"><input aria-label="Reference title" placeholder="Link title" value={refTitle} onChange={e => setRefTitle(e.target.value)}/><input aria-label="Reference URL" type="url" placeholder="https://..." value={refUrl} onChange={e => setRefUrl(e.target.value)}/><Button variant="soft" onClick={addReference}><Plus size={15}/>Add link</Button></div>
          </section>
          <section className="task-notes-section"><SectionHeading icon={<StickyNote size={16}/>}>Notes</SectionHeading><textarea aria-label="Notes" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Keep your private notes here..."/></section>
          {saveError && <div className="alert task-save-error" role="alert">{saveError}</div>}
        </div>
      </div>
      <footer className="task-dialog-footer"><div className="task-footer-secondary">{task ? <>
        <button type="button" title="Duplicate task" aria-label="Duplicate task" onClick={async () => { try { await duplicateTask(user!.uid, task); onClose(); } catch (e) { setError((e as Error).message); } }}><Copy size={16}/></button>
        <button type="button" title={task.archived ? 'Restore task' : 'Archive task'} aria-label={task.archived ? 'Restore task' : 'Archive task'} onClick={async () => { try { await updateTask(user!.uid, task, { archived: !task.archived }); onClose(); } catch (e) { setError((e as Error).message); } }}><Archive size={16}/></button>
        <button type="button" className="task-delete-button" title="Delete task" aria-label="Delete task" onClick={() => setDeleteOpen(true)}><Trash2 size={16}/></button>
      </> : <span className="task-keyboard-hint"><kbd>Ctrl + Enter</kbd> to save</span>}</div><div className="task-footer-primary"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{task ? <Save size={16}/> : <CheckCircle2 size={16}/>} {busy ? 'Saving...' : task ? 'Save changes' : 'Create task'}</Button></div></footer>
    </form>
    {deleteOpen && task && <Confirm title="Delete this task?" onCancel={() => setDeleteOpen(false)} onConfirm={async () => { try { await deleteTask(user!.uid, task); onClose(); } catch (e) { setError((e as Error).message); } }}/>}
  </TaskModal>;
}

export function TaskDetails({ task, onEdit, onClose }: { task: Task; onEdit: () => void; onClose: () => void }) {
  const { projects, user, setError } = useApp();
  const [wide, setWide] = useState(true);
  const [progress, setProgress] = useState(taskProgress(task));
  const [saving, setSaving] = useState(false), [progressMessage, setProgressMessage] = useState('Drag to update');
  const savedProgress = useRef(taskProgress(task));
  const savingRef = useRef(false), draggingRef = useRef(false);
  useEffect(() => {
    const value = taskProgress(task);
    savedProgress.current = value;
    if (!draggingRef.current && !savingRef.current) setProgress(value);
  }, [task.id, task.progress, task.status]);
  const project = projects.find(p => p.id === task.projectId);
  async function saveProgress(value: number) {
    if (savingRef.current) return;
    if (value === savedProgress.current) { setProgressMessage('Drag to update'); return; }
    const previousProgress = savedProgress.current;
    savingRef.current = true; setSaving(true); setProgressMessage('Saving?');
    try {
      await updateTask(user!.uid, task, { progress: value, status: value === 100 ? 'done' : task.status === 'done' ? 'progress' : task.status });
      savedProgress.current = value; setProgressMessage('Saved');
    } catch (e) {
      savedProgress.current = previousProgress; setProgress(previousProgress); setProgressMessage('Could not save. Try again.'); setError((e as Error).message);
    } finally { savingRef.current = false; setSaving(false); }
  }
  return <TaskModal wide={wide} setWide={setWide} project={project?.name} onClose={onClose} titleId="task-details-title">
    <div className="task-dialog-scroll"><div className="task-dialog-content">
      <div className="task-dialog-intro"><span className="task-dialog-eyebrow">Task details{task.archived ? ' - Archived' : ''}</span><h2 id="task-details-title">{task.title}</h2><div className="task-details-project">in <span><span className="dot" style={{ background: project?.color || 'var(--primary)' }}/>{project?.name || 'Personal tasks'}</span></div></div>
      <section className="task-description-box"><div className="task-description-label"><AlignLeft size={15}/>Description</div><p>{task.description || 'No description added yet.'}</p></section>
      <section className="task-properties task-readonly-properties"><h3 className="task-properties-heading">Task properties</h3>
        <div className="task-property"><span><CheckCircle2 size={14}/>Status</span><strong className={`task-status-value status-${task.status}`}><span className="dot"/>{statusLabels[task.status]}</strong></div>
        <div className="task-property"><span><Flag size={14}/>Priority</span><strong className={`priority priority-${task.priority}`}>{task.priority}</strong></div>
        <div className="task-detail-progress">
          <SectionHeading icon={<Gauge size={14}/>}>Progress</SectionHeading>
          <div className="task-progress-value"><strong>{progress}%</strong><span>complete</span></div>
          <input className="task-progress-slider" type="range" min={0} max={100} step={1} value={progress} disabled={saving} aria-label="Task progress" aria-valuetext={`${progress}% complete`} aria-describedby="task-progress-feedback" style={{ '--task-progress': `${progress}%` } as CSSProperties}
            onChange={e => { setProgress(Number(e.target.value)); setProgressMessage('Release to save'); }}
            onPointerDown={e => { draggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerUp={e => { draggingRef.current = false; void saveProgress(Number(e.currentTarget.value)); }}
            onPointerCancel={() => { draggingRef.current = false; setProgress(savedProgress.current); setProgressMessage('Drag to update'); }}
            onKeyUp={e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) void saveProgress(Number(e.currentTarget.value)); }}
            onBlur={e => { if (!draggingRef.current) void saveProgress(Number(e.currentTarget.value)); }}/>
          <span className="task-progress-feedback" id="task-progress-feedback" role="status">{progressMessage}</span>
        </div>
        {[['Deadline', task.deadline], ['Assigned date', task.assignedDate], ['Start date', task.startDate]].map(([label, date]) => <div className="task-property" key={label}><span><CalendarDays size={14}/>{label}</span><strong>{date ? dateLabel(date) : 'Not set'}</strong></div>)}
        <div className="task-property"><span><Bell size={14}/>Notification</span><strong>{task.notificationAt ? format(new Date(task.notificationAt), 'MMM d, yyyy HH:mm') : 'Not set'}</strong></div>
        <div className="task-property"><span><Repeat2 size={14}/>Repeat</span><strong>{task.recurrence.frequency === 'none' ? 'Never' : `Every ${task.recurrence.interval} ${task.recurrence.frequency}${task.recurrence.paused ? ' (paused)' : ''}`}</strong></div>
      </section>
      <section className="task-subtasks-section"><SectionHeading icon={<ListChecks size={16}/>} count={`${task.subtasks.filter(s => s.done).length}/${task.subtasks.length}`}>Subtasks</SectionHeading><div className="task-subtask-list">{task.subtasks.map(s => <div key={s.id} className={`task-subtask-row task-subtask-readonly ${s.done ? 'is-done' : ''}`}><span className="task-subtask-check">{s.done && <Check size={12}/>}</span><span>{s.title}</span></div>)}</div>{!task.subtasks.length && <p className="task-empty-copy">No subtasks added yet.</p>}</section>
      <section className="task-references-section"><SectionHeading icon={<Paperclip size={16}/>} count={task.references.length}>References & links</SectionHeading><div className="task-reference-chips">{task.references.map(r => <div key={r.id}><ExternalLink size={14}/><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a></div>)}</div>{!task.references.length && <p className="task-empty-copy">No references attached.</p>}</section>
      <section className="task-notes-section"><SectionHeading icon={<StickyNote size={16}/>}>Notes</SectionHeading><p className={task.notes ? 'task-notes-text' : 'task-empty-copy'}>{task.notes || 'No notes added yet.'}</p></section>
    </div></div>
    <footer className="task-dialog-footer"><span className="task-keyboard-hint"><kbd>Esc</kbd> to close</span><div className="task-footer-primary"><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={onEdit}><AlignLeft size={16}/>Edit task</Button></div></footer>
  </TaskModal>;
}
