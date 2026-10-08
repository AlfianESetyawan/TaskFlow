import { addDays, format } from 'date-fns';
import { activeTasks } from './data';
import type { Task } from '../types';

export type WidgetSection = 'today' | 'upcoming' | 'overdue' | 'unscheduled';

export function widgetTaskGroups(tasks: Task[], now = new Date()): Record<WidgetSection, Task[]> {
  const today = format(now, 'yyyy-MM-dd');
  const sevenDays = format(addDays(now, 7), 'yyyy-MM-dd');
  const active = activeTasks(tasks);
  const byPriority = (a: Task, b: Task) =>
    ['urgent', 'high', 'medium', 'low'].indexOf(a.priority) -
    ['urgent', 'high', 'medium', 'low'].indexOf(b.priority);

  return {
    today: active
      .filter(task => task.assignedDate === today || task.deadline === today)
      .sort(byPriority),
    upcoming: active
      .filter(task => task.deadline > today && task.deadline <= sevenDays)
      .sort((a, b) => a.deadline.localeCompare(b.deadline) || byPriority(a, b)),
    overdue: active
      .filter(task => Boolean(task.deadline) && task.deadline < today)
      .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    unscheduled: active
      .filter(task => !task.deadline)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
