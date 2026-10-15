import { addDays, format } from 'date-fns';
import { CalendarDays, Check, CheckCircle2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { completeTask, taskProgress, updateTask } from '../services/data';
import type { Task } from '../types';
import { dateLabel, today } from './ui';

export function TaskCard({task,onOpen,compact=false,showProject=true}:{task:Task;onOpen:(task:Task)=>void;compact?:boolean;showProject?:boolean}){const {projects,user,setError}=useApp();const project=projects.find(p=>p.id===task.projectId);return <div className={`task-card ${compact?'compact':''}`} onClick={()=>onOpen(task)}><div className="task-card-main"><button className={`task-check ${task.status==='done'?'checked':''}`} aria-label={task.status==='done'?'Reopen task':'Complete task'} onClick={async e=>{e.stopPropagation();try{if(task.status==='done')await updateTask(user!.uid,task,{status:'todo'});else{await completeTask(user!.uid,task)}}catch(e){setError((e as Error).message)}}}>{task.status==='done'&&<Check size={15}/>}</button><div><strong className={task.status==='done'?'struck':''}>{task.title}</strong><div className="task-meta">{showProject&&project&&<span style={{color:project.color}}><span className="dot" style={{background:project.color}}/>{project.name}</span>}{task.deadline&&<span className={task.status==='done'?'':task.deadline<today()?'overdue':task.deadline<=format(addDays(new Date(),Number(localStorage.getItem('taskflow-warning')||'2')),'yyyy-MM-dd')?'due-soon':''}><CalendarDays size={13}/>{dateLabel(task.deadline)}</span>}{task.subtasks.length>0&&<span><CheckCircle2 size={13}/>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length}</span>}<span>{taskProgress(task)}% complete</span></div></div></div><span className={`priority priority-${task.priority}`}>{task.priority}</span></div>}

export { TaskDetails, TaskEditor, availableReferences, withoutId } from './TaskDialog';
