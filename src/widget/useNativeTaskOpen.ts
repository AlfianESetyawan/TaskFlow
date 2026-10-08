import { useEffect, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Task } from '../types';

export function useNativeTaskOpen(tasks: Task[], onOpen: (task: Task) => void) {
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    let unlisten: UnlistenFn | undefined;
    const take = async () => {
      const id = await invoke<string | null>('take_pending_task');
      if (active && id) setPendingId(id);
    };
    void take().catch(console.error);
    void listen('taskflow:open-task', () => { void take().catch(console.error); }).then(stop => {
      if (active) unlisten = stop;
      else stop();
    });
    return () => { active = false; unlisten?.(); };
  }, []);

  useEffect(() => {
    if (!pendingId) return;
    const task = tasks.find(item => item.id === pendingId);
    if (task) {
      onOpen(task);
      setPendingId('');
    }
  }, [pendingId, tasks, onOpen]);
}
