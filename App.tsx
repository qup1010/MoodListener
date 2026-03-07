import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { initTheme, syncThemeFromSettings } from './theme';
import { FeedbackProvider, confirmAction, dismissTopOverlay } from './src/ui/feedback';
import { fetchSettings } from './services';
import { APP_LOCK_MIN_LENGTH, hashAppLockPassword, normalizeAppLockPassword } from './src/utils/appLock';
import { refreshNotifications } from './src/services/notifications';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const RecordMood = lazy(() => import('./pages/RecordMood').then((m) => ({ default: m.RecordMood })));
const RecordNote = lazy(() => import('./pages/RecordNote').then((m) => ({ default: m.RecordNote })));
const Timeline = lazy(() => import('./pages/Timeline').then((m) => ({ default: m.Timeline })));
const CalendarView = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.CalendarView })));
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings').then((m) => ({ default: m.NotificationSettings })));
const AboutInfo = lazy(() => import('./pages/AboutInfo').then((m) => ({ default: m.AboutInfo })));
const TagManagement = lazy(() => import('./pages/TagManagement').then((m) => ({ default: m.TagManagement })));
const IconSettings = lazy(() => import('./pages/IconSettings').then((m) => ({ default: m.IconSettings })));
const EntryDetail = lazy(() => import('./pages/EntryDetail').then((m) => ({ default: m.EntryDetail })));

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
                title: '退出应用？',
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
  <div className="flex min-h-screen items-center justify-center bg-background-light text-sm text-gray-500 dark:bg-background-dark dark:text-gray-400">
    加载中...
  </div>
);

const AppLockScreen: React.FC<{
  input: string;
  error: string;
  checking: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ input, error, checking, onChange, onSubmit }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ui-surface-page-light)] px-5 dark:bg-[var(--ui-surface-page-dark)]">
      <div className="w-full max-w-sm rounded-[28px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] p-6 shadow-[var(--ui-elevation-card)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[28px]">lock</span>
        </div>
        <h1 className="text-center text-xl font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">输入应用密码</h1>
        <p className="mt-2 text-center text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
          已开启应用锁，进入前需要先验证密码。
        </p>
        <input
          autoFocus
          type="password"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={`请输入至少 ${APP_LOCK_MIN_LENGTH} 位密码`}
          className="mt-5 h-12 w-full rounded-2xl border border-[var(--ui-border-subtle-light)] bg-white px-4 text-sm text-[var(--ui-text-primary-light)] outline-none transition-colors focus:border-primary dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5 dark:text-[var(--ui-text-primary-dark)]"
        />
        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
        <button
          type="button"
          onClick={onSubmit}
          disabled={checking}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {checking ? '验证中...' : '解锁进入'}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lockReady, setLockReady] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockHash, setLockHash] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(true);
  const [lockInput, setLockInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const appLockEnabledRef = useRef(false);

  const lockImmediately = () => {
    if (!appLockEnabledRef.current) return;
    setLockEnabled(true);
    setUnlocked(false);
    setLockInput('');
    setLockError('');
    setLockReady(true);
  };

  const refreshLockState = async (resetUnlock = false) => {
    try {
      const settings = await fetchSettings();
      const enabled = !!settings.app_lock_enabled && !!settings.app_lock_password_hash;
      appLockEnabledRef.current = enabled;
      setLockEnabled(enabled);
      setLockHash(settings.app_lock_password_hash || null);
      if (enabled) {
        if (resetUnlock) {
          lockImmediately();
        }
      } else {
        setUnlocked(true);
        setLockInput('');
        setLockError('');
      }
    } catch (error) {
      console.error('Lock state load failed:', error);
      setUnlocked(true);
    } finally {
      setLockReady(true);
    }
  };

  useEffect(() => {
    initTheme();
    void syncThemeFromSettings();
    void refreshLockState(true);

    let cleanup: (() => void) | undefined;
    let appStateCleanup: (() => void) | undefined;
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

    const setupAppLockLifecycle = async () => {
      const handleAppLockChanged = () => {
        void refreshLockState();
      };

      window.addEventListener('moodlistener:app-lock-changed', handleAppLockChanged);

      if (Capacitor.isNativePlatform()) {
        try {
          const { App: CapacitorApp } = await import('@capacitor/app');
          const listener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
              lockImmediately();
              return;
            }

            lockImmediately();
            void refreshLockState(true);
            void refreshNotifications();
          });

          const pauseListener = await CapacitorApp.addListener('pause', () => {
            lockImmediately();
          });

          if (disposed) {
            listener.remove();
            pauseListener.remove();
            return;
          }

          appStateCleanup = () => {
            listener.remove();
            pauseListener.remove();
            window.removeEventListener('moodlistener:app-lock-changed', handleAppLockChanged);
          };
        } catch (error) {
          console.error('App lock lifecycle setup failed:', error);
        }
        return;
      }

      const handleVisibility = () => {
        if (document.hidden) {
          lockImmediately();
          return;
        }

        lockImmediately();
        void refreshLockState(true);
      };

      document.addEventListener('visibilitychange', handleVisibility);
      appStateCleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('moodlistener:app-lock-changed', handleAppLockChanged);
      };
    };

    void setupNotifications();
    void setupAppLockLifecycle();

    return () => {
      disposed = true;
      cleanup?.();
      appStateCleanup?.();
    };
  }, []);

  const handleUnlock = async () => {
    const normalized = normalizeAppLockPassword(lockInput);
    if (!normalized) {
      setLockError('请输入应用密码。');
      return;
    }
    if (!lockHash) {
      setUnlocked(true);
      return;
    }

    setUnlocking(true);
    try {
      const nextHash = await hashAppLockPassword(normalized);
      if (nextHash !== lockHash) {
        setLockError('密码不正确，请重新输入。');
        return;
      }
      setUnlocked(true);
      setLockInput('');
      setLockError('');
    } finally {
      setUnlocking(false);
    }
  };

  if (!lockReady) {
    return <RouteFallback />;
  }

  if (lockEnabled && !unlocked) {
    return (
      <FeedbackProvider>
        <AppLockScreen
          input={lockInput}
          error={lockError}
          checking={unlocking}
          onChange={(value) => {
            setLockInput(value);
            if (lockError) setLockError('');
          }}
          onSubmit={() => void handleUnlock()}
        />
      </FeedbackProvider>
    );
  }

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
            <Route path="/record/note" element={<RecordNote />} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/about" element={<AboutInfo />} />
            <Route path="/settings/tags" element={<TagManagement />} />
            <Route path="/settings/icons" element={<IconSettings />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </FeedbackProvider>
  );
};

export default App;
