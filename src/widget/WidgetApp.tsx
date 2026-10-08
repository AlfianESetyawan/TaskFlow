import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { AlertCircle, ArrowUpRight, CalendarDays, Check, Circle, Clock3, LogOut, Moon, Plus, Sun, X } from 'lucide-react';
import { auth, configured } from '../services/firebase';
import { useWindowVisibility } from '../hooks/useWindowVisibility';
import { createTask, updateTask, watchProjects, watchTasks } from '../services/data';
import { widgetTaskGroups, type WidgetSection } from '../services/widgetTasks';
import type { Project, Task } from '../types';
import './widget.css';

const sections: { key: WidgetSection; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Next 7d' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'unscheduled', label: 'No date' },
];

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function useWidgetData() {
  const visible = useWindowVisibility();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [dataLoading, setDataLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth) return;
    void setPersistence(auth, browserLocalPersistence).catch(error => setError(message(error)));
    return onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setAuthLoading(false);
    }, error => {
      setError(message(error));
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !visible) {
      if (!user) { setTasks([]); setProjects([]); }
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    let tasksReady = false;
    let projectsReady = false;
    const ready = () => { if (tasksReady && projectsReady) setDataLoading(false); };
    const unsubscribeTasks = watchTasks(user.uid, rows => {
      setTasks(rows);
      tasksReady = true;
      ready();
    }, error => {
      setError(`Tasks: ${message(error)}`);
      setDataLoading(false);
    });
    const unsubscribeProjects = watchProjects(user.uid, rows => {
      setProjects(rows);
      projectsReady = true;
      ready();
    }, error => {
      setError(`Projects: ${message(error)}`);
      setDataLoading(false);
    });
    return () => { unsubscribeTasks(); unsubscribeProjects(); };
  }, [user, visible]);

  return { user, authLoading, dataLoading, tasks, projects, error, setError };
}

async function openFullApp(taskId?: string) {
  if (isTauri()) {
    await invoke('open_main_window', { taskId: taskId ?? null });
  } else {
    location.assign(taskId ? `/tasks?task=${encodeURIComponent(taskId)}` : '/');
  }
}

function TaskRow({ task, project, busy, onToggle, onOpen }: {
  task: Task;
  project?: Project;
  busy: boolean;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  return <div className="widget-task">
    <button className="widget-check" aria-label={`Complete ${task.title}`} disabled={busy} onClick={() => onToggle(task)}>
      {busy ? <Clock3 size={15} /> : <Circle size={18} />}
    </button>
    <button className="widget-task-content" onClick={() => onOpen(task)} title={`Open ${task.title} in TaskFlow`}>
      <strong>{task.title}</strong>
      <span className="widget-task-meta">
        {project && <span className="widget-project"><i style={{ background: project.color }} />{project.name}</span>}
        {task.deadline && <span className={task.deadline < format(new Date(), 'yyyy-MM-dd') ? 'widget-late' : ''}>
          <CalendarDays size={12} /> {format(parseISO(task.deadline), 'MMM d')}
        </span>}
        {task.subtasks.length > 0 && <span>{task.subtasks.filter(item => item.done).length}/{task.subtasks.length} steps</span>}
      </span>
    </button>
    <span className={`widget-priority widget-${task.priority}`} title={`${task.priority} priority`} />
  </div>;
}

export default function WidgetApp() {
  const { user, authLoading, dataLoading, tasks, projects, error, setError } = useWidgetData();
  const [now, setNow] = useState(new Date());
  const [section, setSection] = useState<WidgetSection>('today');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('taskflow-theme') === 'dark' ? 'dark' : 'light');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectId, setProjectId] = useState('');
  const [focusToday, setFocusToday] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState('');
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);
  const groups = useMemo(() => widgetTaskGroups(tasks, now), [tasks, now]);
  const visibleTasks = groups[section].slice(0, 8);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('taskflow-theme', theme);
  }, [theme]);
  useEffect(() => setLastCompleted(null), [user?.uid]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!auth || loginBusy) return;
    setLoginBusy(true);
    setError('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (error) { setError(message(error)); }
    finally { setLoginBusy(false); }
  }

  async function quickAdd(event: FormEvent) {
    event.preventDefault();
    if (!user || !title.trim() || saveBusy) return;
    setSaveBusy(true);
    setSaved(false);
    setError('');
    try {
      await createTask(user.uid, {
        title: title.trim(),
        projectId,
        deadline,
        assignedDate: focusToday ? format(now, 'yyyy-MM-dd') : '',
      });
      setTitle('');
      setDeadline('');
      setProjectId('');
      setFocusToday(false);
      setQuickOpen(false);
      setSaved(true);
      setSection(focusToday || deadline === format(now, 'yyyy-MM-dd') ? 'today' : deadline ? 'upcoming' : 'unscheduled');
    } catch (error) { setError(message(error)); }
    finally { setSaveBusy(false); }
  }

  async function complete(task: Task) {
    if (!user || busyTaskId) return;
    setBusyTaskId(task.id);
    setError('');
    try { await updateTask(user.uid, task, { status: 'done' }); setLastCompleted(task); }
    catch (error) { setError(message(error)); }
    finally { setBusyTaskId(''); }
  }

  function run(action: () => Promise<unknown>) {
    void action().catch(error => setError(message(error)));
  }

  return <div className="widget-shell">
    <header className="widget-header">
      <span className="widget-brand"><span className="widget-brand-mark"><Check size={15} /></span>TaskFlow <small>WIDGET</small></span>
      <div className="widget-header-actions">
        <button title={theme === 'light' ? 'Use dark theme' : 'Use light theme'} aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <button title="Hide to tray" aria-label="Hide to tray" onClick={() => run(() => isTauri() ? invoke('hide_widget') : Promise.resolve(location.assign('/')))}><X size={17} /></button>
      </div>
    </header>

    {!configured ? <div className="widget-state"><AlertCircle /><strong>Firebase is not configured</strong><p>Add the VITE_FIREBASE values to `.env`, then restart the app.</p></div> :
      authLoading ? <div className="widget-state">Checking your session...</div> :
      !user ? <div className="widget-signin">
        <div className="widget-intro"><span>✨ Stay in your flow</span><h1>Your day, at a glance.</h1><p>Sign in to see the same tasks as your TaskFlow workspace.</p></div>
        {error && <div className="widget-error" role="alert">{error}</div>}
        <form onSubmit={login}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
          <button className="widget-primary" disabled={loginBusy}>{loginBusy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <button className="widget-link" onClick={() => run(() => openFullApp())}>Open full TaskFlow <ArrowUpRight size={14} /></button>
        <p className="widget-hint">Google sign-in for the desktop widget will use a system-browser flow in a later phase.</p>
      </div> : <>
        <section className="widget-hero">
          <span>{format(now, 'EEEE, MMMM d')}</span>
          <h1>{groups.today.length ? `${groups.today.length} thing${groups.today.length === 1 ? '' : 's'} to focus on` : 'A clear day ahead'}</h1>
          <p>{groups.overdue.length ? `${groups.overdue.length} overdue task${groups.overdue.length === 1 ? '' : 's'} need attention` : 'Make room for momentum.'}</p>
        </section>

        <div className="widget-tabs" role="tablist" aria-label="Task sections">
          {sections.map(item => <button key={item.key} role="tab" aria-selected={section === item.key} className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)}>
            {item.label}<small>{groups[item.key].length}</small>
          </button>)}
        </div>

        <main className="widget-main">
          {saved && <div className="widget-undo" role="status"><span>Task saved</span><button aria-label="Dismiss" onClick={() => setSaved(false)}><X size={13} /></button></div>}
          {error && <div className="widget-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={14} /></button></div>}
          {lastCompleted && <div className="widget-undo" role="status"><span>Completed {lastCompleted.title}</span><button onClick={() => run(async () => { await updateTask(user!.uid, lastCompleted, { status: 'todo' }); setLastCompleted(null); })}>Undo</button><button aria-label="Dismiss" onClick={() => setLastCompleted(null)}><X size={13} /></button></div>}
          {dataLoading ? <div className="widget-state compact">Loading tasks...</div> :
            visibleTasks.length ? <div className="widget-list">{visibleTasks.map(task => <TaskRow key={task.id} task={task} project={projects.find(project => project.id === task.projectId)} busy={busyTaskId === task.id} onToggle={complete} onOpen={task => run(() => openFullApp(task.id))} />)}</div> :
            <div className="widget-state compact"><Check size={23} /><strong>{section === 'today' ? 'Nothing on your focus list' : section === 'upcoming' ? 'No upcoming deadlines' : section === 'overdue' ? 'All caught up' : 'No unscheduled tasks'}</strong><p>{section === 'unscheduled' ? 'Tasks without deadlines will appear here.' : 'Enjoy the breathing room.'}</p></div>}
          {groups[section].length > 8 && <button className="widget-more" onClick={() => run(() => openFullApp())}>View {groups[section].length - 8} more in TaskFlow <ArrowUpRight size={14} /></button>}
        </main>

        <div className="widget-bottom">
          {quickOpen && <form className="widget-quick-form" onSubmit={quickAdd}>
            <label>Task title<input autoFocus required maxLength={300} value={title} onChange={event => setTitle(event.target.value)} placeholder="What needs doing?" /></label>
            <div className="widget-form-row"><label>Deadline (optional)<input type="date" value={deadline} onChange={event => setDeadline(event.target.value)} /></label><label>Project<select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Personal</option>{projects.filter(project => !project.archived).map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label></div>
            <label className="widget-checkbox"><input type="checkbox" checked={focusToday} onChange={event => setFocusToday(event.target.checked)} /> Add to today's focus</label>
            <div className="widget-form-actions"><button type="button" onClick={() => setQuickOpen(false)}>Cancel</button><button className="widget-primary" disabled={saveBusy}>{saveBusy ? 'Saving...' : 'Save task'}</button></div>
          </form>}
          <div className="widget-footer">
            <button className="widget-add" onClick={() => setQuickOpen(!quickOpen)}><Plus size={17} /> {quickOpen ? 'Close quick add' : 'Quick Add'}</button>
            <button className="widget-icon-link" title="Open full TaskFlow" aria-label="Open full TaskFlow" onClick={() => run(() => openFullApp())}><ArrowUpRight size={18} /></button>
            <button className="widget-icon-link" title="Sign out" aria-label="Sign out" onClick={() => run(() => signOut(auth!))}><LogOut size={17} /></button>
          </div>
        </div>
      </>}
  </div>;
}
