import { Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Folder, ListChecks, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { taskProgress, updateTask } from '../services/data';
import { statusLabels, type Task } from '../types';
import { dateLabel, today } from './ui';
import './task-tile.css';

export function TaskTile({ task, onOpen, selected, onSelect }: {
  task: Task; onOpen: (task: Task) => void; selected?: boolean; onSelect?: (selected: boolean) => void;
}) {
  const { projects, user, setError } = useApp();
  const project = projects.find(project => project.id === task.projectId);
  const progress = taskProgress(task);
  const projectColor = project?.color || '#64748b';
  const channels = [1, 3, 5].map(offset => {
    const channel = parseInt(projectColor.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const headerText = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179 ? '#000000' : '#ffffff';
  const overdue = task.status !== 'done' && task.deadline && task.deadline < today();
  return <article className={`task-tile ${selected ? 'is-selected' : ''} ${task.status === 'done' ? 'is-complete' : ''}`}>
    <div className="task-tile-top" style={{ backgroundColor: projectColor, color: headerText }}>
      <span className="task-tile-project" title={project?.name || 'Personal tasks'}><Folder size={13}/><span>{project?.name || 'Personal tasks'}</span></span>
      <span className={`priority priority-${task.priority}`}>{task.priority}</span>
      {onSelect && <input className="task-tile-select" type="checkbox" aria-label={`Select ${task.title}`} checked={selected} onChange={event => onSelect(event.target.checked)}/>}
    </div>
    <button className="task-tile-open" onClick={() => onOpen(task)} aria-label={`View details: ${task.title}`}>
      <h2>{task.title}</h2><p>{task.description || 'No description added yet.'}</p>
    </button>
    <div className="task-tile-dates"><span className={overdue ? 'overdue' : ''}><CalendarDays size={13}/>{task.deadline ? `${overdue ? 'Overdue: ' : 'Due '}${dateLabel(task.deadline)}` : 'No deadline'}</span>{task.assignedDate && <span>Assigned {dateLabel(task.assignedDate)}</span>}</div>
    <div className="task-tile-progress"><span>Progress</span><strong>{progress}%</strong><div className="progress"><span style={{ width: `${progress}%` }}/></div></div>
    <div className="task-tile-extras"><span><ListChecks size={13}/>{task.subtasks.filter(subtask => subtask.done).length}/{task.subtasks.length} subtasks</span>{task.references.length > 0 && <span><Paperclip size={13}/>{task.references.length} {task.references.length === 1 ? 'link' : 'links'}</span>}{task.notificationAt && <span title={format(new Date(task.notificationAt), 'MMM d, yyyy HH:mm')}><Bell size={13}/>Reminder</span>}</div>
    <footer className="task-tile-footer"><button className={`task-tile-complete ${task.status === 'done' ? 'is-done' : ''}`} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`} onClick={async () => { try { await updateTask(user!.uid, task, { status: task.status === 'done' ? 'todo' : 'done' }); } catch (error) { setError((error as Error).message); } }}>{task.status === 'done' ? <Check size={14}/> : <CheckCircle2 size={14}/>}<span>{statusLabels[task.status]}</span></button><button className="task-tile-details" onClick={() => onOpen(task)}>Details<ChevronRight size={14}/></button></footer>
  </article>;
}
