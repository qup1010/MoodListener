import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { initWebStorage } from './src/storage/webStorage';
import { initTheme } from './theme';

// 绔嬪嵆鍒濆鍖栦富棰橈紝闃叉 React 娓叉煋鍓嶇殑鐧借壊闂睆
initTheme();

// 鍒濆鍖栧瓨鍌?
if (Capacitor.isNativePlatform()) {
  // 鍘熺敓鐜锛氬垵濮嬪寲 SQLite
  import('./src/storage/database').then(db => {
    db.getDBConnection().catch(err => console.error('DB Init Error:', err));
  });
} else {
  // Web 鐜锛氬垵濮嬪寲 localStorage
  initWebStorage();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
