import { BrowserRouter, HashRouter } from 'react-router-dom';
import { isTauri } from '@tauri-apps/api/core';
import { AppProvider } from './contexts/AppContext';
import App from './App';

export default function WebApp() {
  const Router = isTauri() ? HashRouter : BrowserRouter;
  return <Router><AppProvider><App /></AppProvider></Router>;
}
