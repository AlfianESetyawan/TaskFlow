import { addDoc, collection, deleteDoc, doc, onSnapshot, query, orderBy, limit, runTransaction, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Activity, Project, Task, Template, Status } from '../types';
import { addDays, addMonths, addWeeks, format, parseISO } from 'date-fns';

const path = (uid:string, name:string) => collection(db!, 'users', uid, name);
const idPath = (uid:string, name:string, id:string) => doc(db!, 'users', uid, name, id);
const now = () => new Date().toISOString();
export const blankTask = (): Omit<Task,'id'> => ({title:'',description:'',projectId:'',assignedDate:'',startDate:'',deadline:'',priority:'medium',status:'todo',subtasks:[],references:[],notes:'',recurrence:{frequency:'none',interval:1,endDate:'',paused:false},completedAt:'',createdAt:now(),updatedAt:now(),archived:false,occurrenceKey:''});
export const watchTasks = (uid:string, callback:(rows:Task[])=>void, fail:(error:Error)=>void):Unsubscribe => onSnapshot(query(path(uid,'tasks'),orderBy('createdAt','desc'),limit(1000)), snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()} as Task))),fail);
export const watchProjects = (uid:string, callback:(rows:Project[])=>void, fail:(error:Error)=>void):Unsubscribe => onSnapshot(query(path(uid,'projects'),orderBy('createdAt','desc'),limit(300)), snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()} as Project))),fail);
export const watchTemplates = (uid:string, callback:(rows:Template[])=>void, fail:(error:Error)=>void):Unsubscribe => onSnapshot(query(path(uid,'templates'),orderBy('createdAt','desc'),limit(200)), snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()} as Template))),fail);
export const watchActivity = (uid:string, callback:(rows:Activity[])=>void, fail:(error:Error)=>void):Unsubscribe => onSnapshot(query(path(uid,'activityLogs'),orderBy('at','desc'),limit(100)),snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()} as Activity))),fail);
async function log(uid:string, task:Task, action:string) { await addDoc(path(uid,'activityLogs'),{taskId:task.id,taskTitle:task.title,action,at:now()}); }
export async function createTask(uid:string, input:Partial<Task>) { const task={...blankTask(),...input,createdAt:now(),updatedAt:now()}; const ref=await addDoc(path(uid,'tasks'),task); void log(uid,{...task,id:ref.id},'created').catch(()=>{}); return ref.id; }
export async function updateTask(uid:string, task:Task, patch:Partial<Task>) { const update={...patch,updatedAt:now(),...(patch.status==='done'&&task.status!=='done'?{completedAt:now()}:{}),...(patch.status&&patch.status!=='done'&&task.status==='done'?{completedAt:''}:{})}; await updateDoc(idPath(uid,'tasks',task.id),update); const action=patch.status&&patch.status!==task.status?`moved to ${patch.status}`:patch.deadline!==undefined&&patch.deadline!==task.deadline?'changed deadline':patch.archived!==undefined?'archived':'updated'; void log(uid,task,action).catch(()=>{}); if(patch.status==='done'&&task.status!=='done')await generateNextOccurrence(uid,{...task,...patch},[]); }
export async function deleteTask(uid:string, task:Task) { await deleteDoc(idPath(uid,'tasks',task.id)); void log(uid,task,'deleted').catch(()=>{}); }
export async function duplicateTask(uid:string, task:Task) { const {id:_id,...copy}=task; void _id; return createTask(uid,{...copy,title:`${task.title} (copy)`,status:'todo',completedAt:'',occurrenceKey:''}); }
export async function createProject(uid:string, input:Pick<Project,'name'|'description'|'color'|'priority'>) { await addDoc(path(uid,'projects'),{...input,archived:false,createdAt:now(),updatedAt:now()}); }
export async function updateProject(uid:string, project:Project, patch:Partial<Project>) { await updateDoc(idPath(uid,'projects',project.id),{...patch,updatedAt:now()}); }
export async function createTemplate(uid:string, input:Pick<Template,'name'|'title'|'description'|'priority'|'subtasks'>) { await addDoc(path(uid,'templates'),{...input,createdAt:now()}); }
export async function updateTemplate(uid:string, template:Template, patch:Partial<Template>) { await updateDoc(idPath(uid,'templates',template.id),patch); }
export async function deleteTemplate(uid:string, template:Template) { await deleteDoc(idPath(uid,'templates',template.id)); }
export function activeTasks(tasks:Task[]) { return tasks.filter(t=>!t.archived&&t.status!=='done'); }
export function upcomingDeadlines(tasks:Task[], days=7) { const today=format(new Date(),'yyyy-MM-dd');const end=format(addDays(new Date(),days),'yyyy-MM-dd');return activeTasks(tasks).filter(t=>t.deadline&&t.deadline>=today&&t.deadline<=end).sort((a,b)=>a.deadline.localeCompare(b.deadline)); }
export function overdueTasks(tasks:Task[]) { const today=format(new Date(),'yyyy-MM-dd');return activeTasks(tasks).filter(t=>t.deadline&&t.deadline<today); }
export function unscheduledTasks(tasks:Task[]) { return activeTasks(tasks).filter(t=>!t.deadline); }
export const fetchActiveTasks = (tasks:Task[]) => activeTasks(tasks);
export const fetchUpcomingDeadlines = (tasks:Task[],days=7) => upcomingDeadlines(tasks,days);
export const fetchOverdueTasks = (tasks:Task[]) => overdueTasks(tasks);
export const fetchTasksWithoutDeadlines = (tasks:Task[]) => unscheduledTasks(tasks);
export const updateTaskStatus = (uid:string,task:Task,status:Status) => updateTask(uid,task,{status});
export const completeTask = (uid:string,task:Task) => updateTaskStatus(uid,task,'done');
export async function generateNextOccurrence(uid:string, task:Task, existing:Task[]) { const r=task.recurrence;if(r.frequency==='none'||r.paused||!task.deadline)return;const date=parseISO(task.deadline);const next=r.frequency==='daily'?addDays(date,r.interval):r.frequency==='weekly'?addWeeks(date,r.interval):r.frequency==='monthly'?addMonths(date,r.interval):addDays(date,r.interval);const root=task.occurrenceKey?task.occurrenceKey.split(':')[0]:task.id;const key=`${root}:${format(next,'yyyy-MM-dd')}`;if((r.endDate&&format(next,'yyyy-MM-dd')>r.endDate)||existing.some(t=>t.occurrenceKey===key))return;const ref=idPath(uid,'tasks',key);const created=await runTransaction(db!,async tx=>{if((await tx.get(ref)).exists())return false;const {id:_id,...copy}=task;void _id;tx.set(ref,{...copy,deadline:format(next,'yyyy-MM-dd'),assignedDate:format(next,'yyyy-MM-dd'),status:'todo',completedAt:'',occurrenceKey:key,createdAt:now(),updatedAt:now()});return true});if(created)void log(uid,{...task,id:key},'created recurring occurrence').catch(()=>{}); }

