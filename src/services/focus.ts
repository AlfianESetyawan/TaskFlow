import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Priority, Project, Task } from '../types';

const priorityPoints: Record<Priority, number> = {
  low: 20,
  medium: 40,
  high: 60,
  urgent: 80,
};

const projectPoints: Record<Priority, number> = {
  low: 0,
  medium: 4,
  high: 8,
  urgent: 12,
};

export function focusScore(task: Task, projects: Project[], date = new Date()): number {
  const project = projects.find(p => p.id === task.projectId);
  const importance = priorityPoints[task.priority] + (project ? projectPoints[project.priority || 'medium'] : 0);
  const daysUntilDeadline = task.deadline ? differenceInCalendarDays(parseISO(task.deadline), date) : null;
  const deadline = daysUntilDeadline === null ? 0
    : daysUntilDeadline < 0 ? 50 + Math.min(25, -daysUntilDeadline * 5)
    : Math.round(50 / (1 + daysUntilDeadline / 5));
  const assignedToday = task.assignedDate === format(date, 'yyyy-MM-dd') ? 8 : 0;
  return importance + deadline + assignedToday;
}

export function rankFocusTasks(tasks: Task[], projects: Project[], date = new Date()): Task[] {
  return [...tasks].sort((a, b) =>
    focusScore(b, projects, date) - focusScore(a, projects, date)
    || (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')
    || a.title.localeCompare(b.title)
    || a.id.localeCompare(b.id)
  );
}
