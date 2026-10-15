import { isTauri } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import type { Task } from '../types';

const deliveredKey = (uid: string, task: Task) => `taskflow:notification:${uid}:${task.id}:${task.notificationAt}`;
const catchUpMs = 15 * 60 * 1000;
let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return true;
  if (await isPermissionGranted()) return true;
  if (permissionRequested) return false;
  permissionRequested = true;
  return (await requestPermission()) === 'granted';
}

export async function deliverDueNotifications(uid: string, tasks: Task[], now = Date.now()): Promise<void> {
  if (!isTauri()) return;
  const due = tasks.filter(task => {
    if (!task.notificationAt || task.archived || task.status === 'done') return false;
    const at = Date.parse(task.notificationAt);
    return Number.isFinite(at) && at <= now && now - at <= catchUpMs
      && !localStorage.getItem(deliveredKey(uid, task));
  });
  if (!due.length || !await ensureNotificationPermission()) return;
  for (const task of due) {
    sendNotification({ title: task.title, body: 'TaskFlow task reminder' });
    localStorage.setItem(deliveredKey(uid, task), '1');
  }
}
