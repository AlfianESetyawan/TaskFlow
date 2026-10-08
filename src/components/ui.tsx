import type { ReactNode } from 'react';
import { CircleHelp, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Task } from '../types';

export const today=()=>format(new Date(),'yyyy-MM-dd');

export const dateLabel=(d:string)=>d?format(parseISO(d),localStorage.getItem('taskflow-date')||'MMM d, yyyy'):'No deadline';

export function Button({children,onClick,variant='primary',type='button',disabled=false}:{children:ReactNode;onClick?:()=>void;variant?:'primary'|'soft'|'ghost'|'danger';type?:'button'|'submit';disabled?:boolean}){return <button className={`btn btn-${variant}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>}

export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}

export function Empty({title,detail,action}:{title:string;detail?:string;action?:ReactNode}){return <div className="empty"><CircleHelp size={28}/><h3>{title}</h3>{detail&&<p>{detail}</p>}{action}</div>}

export function Confirm({title,onCancel,onConfirm}:{title:string;onCancel:()=>void;onConfirm:()=>void}){return <div className="modal-backdrop"><div className="modal small"><h2>{title}</h2><p>This action cannot be undone.</p><div className="form-actions"><Button variant="soft" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={onConfirm}>Delete</Button></div></div></div>}
