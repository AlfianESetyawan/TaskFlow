import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './styles.css';

const widget = (isTauri() && getCurrentWindow().label === 'widget') ||
  new URLSearchParams(location.search).has('widget-preview');
const Entry = lazy(() => widget ? import('./widget/WidgetApp') : import('./WebApp'));

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="center-screen">Loading TaskFlow...</div>}>
      <Entry />
    </Suspense>
  </React.StrictMode>,
);
