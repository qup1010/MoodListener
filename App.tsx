import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { RecordMood } from './pages/RecordMood';
import { Timeline } from './pages/Timeline';
import { CalendarView } from './pages/Calendar';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { NotificationSettings } from './pages/NotificationSettings';
import { AboutInfo } from './pages/AboutInfo';
import { ProfileSettings } from './pages/ProfileSettings';
import { TagManagement } from './pages/TagManagement';
import { EntryDetail } from './pages/EntryDetail';
import { initTheme, syncThemeFromSettings } from './theme';

const App: React.FC = () => {
  useEffect(() => {
    initTheme();
    // 异步同步主题设置
    syncThemeFromSettings();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Main tabs wrapped in Layout */}
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/history" element={<Layout><Timeline /></Layout>} />
        <Route path="/calendar" element={<Layout><CalendarView /></Layout>} />
        <Route path="/stats" element={<Layout><Stats /></Layout>} />

        {/* Standalone pages */}
        <Route path="/record" element={<RecordMood />} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/settings/notifications" element={<NotificationSettings />} />
        <Route path="/settings/about" element={<AboutInfo />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/settings/tags" element={<TagManagement />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
      </Routes>
    </HashRouter>
  );
};

export default App;