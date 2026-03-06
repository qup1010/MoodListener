import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { initTheme, syncThemeFromSettings } from './theme';
import { FeedbackProvider, confirmAction, dismissTopOverlay } from './src/ui/feedback';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const RecordMood = lazy(() => import('./pages/RecordMood').then(m => ({ default: m.RecordMood })));
const Timeline = lazy(() => import('./pages/Timeline').then(m => ({ default: m.Timeline })));
const CalendarView = lazy(() => import('./pages/Calendar').then(m => ({ default: m.CalendarView })));
const Stats = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings').then(m => ({ default: m.NotificationSettings })));
const AboutInfo = lazy(() => import('./pages/AboutInfo').then(m => ({ default: m.AboutInfo })));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const TagManagement = lazy(() => import('./pages/TagManagement').then(m => ({ default: m.TagManagement })));
const EntryDetail = lazy(() => import('./pages/EntryDetail').then(m => ({ default: m.EntryDetail })));

const PRIMARY_ROUTES = new Set(['/home', '/history', '/calendar', '/stats', '/settings']);

const resolvePrimaryRoute = (pathname: string): string | null => {
  if (PRIMARY_ROUTES.has(pathname)) return pathname;
  if (pathname === '/record') return '/home';
  if (pathname.startsWith('/settings/')) return '/settings';
  if (pathname.startsWith('/entry/')) return '/history';
  return null;
};

const NativeBackHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const setupBackButtonListener = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (dismissTopOverlay()) {
            return;
          }

          const currentPath = pathnameRef.current;
          const primaryRoute = resolvePrimaryRoute(currentPath);

          if (primaryRoute && primaryRoute !== currentPath) {
            navigate(primaryRoute, { replace: true });
            return;
          }

          if (primaryRoute) {
            void (async () => {
              const shouldExit = await confirmAction({
                title: '退出应用',
                message: '确认退出 MoodListener 吗？',
                confirmText: '退出',
                cancelText: '取消',
                danger: true
              });
              if (shouldExit) {
                void App.exitApp();
              }
            })();
            return;
          }

          if (canGoBack) {
            window.history.back();
            return;
          }

          navigate('/home', { replace: true });
        });

        if (disposed) {
          listener.remove();
          return;
        }

        cleanup = () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Back button listener setup failed:', error);
      }
    };

    void setupBackButtonListener();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [navigate]);

  return null;
};

const RouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 bg-background-light dark:bg-background-dark">
    加载中...
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    initTheme();
    void syncThemeFromSettings();

    let cleanup: (() => void) | undefined;
    let disposed = false;

    const setupNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const listener = await LocalNotifications.addListener('localNotificationActionPerformed', () => {
          window.location.hash = '#/record';
        });

        if (disposed) {
          listener.remove();
          return;
        }

        cleanup = () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Notification listener setup failed:', error);
      }
    };

    void setupNotifications();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <FeedbackProvider>
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <NativeBackHandler />
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route path="/home" element={<Layout><Home /></Layout>} />
            <Route path="/history" element={<Layout><Timeline /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarView /></Layout>} />
            <Route path="/stats" element={<Layout><Stats /></Layout>} />

            <Route path="/record" element={<RecordMood />} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/about" element={<AboutInfo />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/tags" element={<TagManagement />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </FeedbackProvider>
  );
};

export default App;

