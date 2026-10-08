import { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useWindowVisibility(): boolean {
  const [visible, setVisible] = useState(!isTauri());

  useEffect(() => {
    if (!isTauri()) return;
    const window = getCurrentWindow();
    let active = true;
    let unlisten: (() => void) | undefined;

    void window.listen<boolean>('taskflow:visibility', event => {
      if (active) setVisible(event.payload);
    }).then(stop => {
      if (!active) { stop(); return; }
      unlisten = stop;
      return window.isVisible().then(value => {
        if (active) setVisible(value);
      });
    }).catch(console.error);

    return () => { active = false; unlisten?.(); };
  }, []);

  return visible;
}
