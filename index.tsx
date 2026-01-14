import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { initWebStorage } from './src/storage/webStorage';

// 初始化存储
if (Capacitor.isNativePlatform()) {
  // 原生环境：初始化 SQLite
  import('./src/storage/database').then(db => {
    db.getDBConnection().catch(err => console.error('DB Init Error:', err));
  });
} else {
  // Web 环境：初始化 localStorage
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
