import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { resolvePageChromeConfig } from '../src/ui/chrome';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { key: 'home', path: '/home', label: '首页', icon: 'home' },
  { key: 'history', path: '/history', label: '历史', icon: 'calendar_month', aliases: ['/calendar'] },
  { key: 'stats', path: '/stats', label: '统计', icon: 'bar_chart' },
  { key: 'settings', path: '/settings', label: '设置', icon: 'settings' }
] as const;

const triggerTabHaptic = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(10);
  }
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const chromeConfig = resolvePageChromeConfig(location.pathname);
  const contentPaddingClass = chromeConfig.showFab ? 'pb-36' : chromeConfig.showTab ? 'pb-28' : 'pb-0';

  const isNavActive = (path: string, aliases?: readonly string[]) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(`${path}/`)) return true;
    return !!aliases?.some((alias) => location.pathname === alias || location.pathname.startsWith(`${alias}/`));
  };

  const handleTabPress = (path: string) => {
    triggerTabHaptic();
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className={`flex-1 ${contentPaddingClass}`}>{children}</div>

      {chromeConfig.showFab && chromeConfig.fabAction === 'record' && (
        <button
          aria-label="快速记录"
          className="fixed right-5 z-40 size-12 rounded-full border border-black/10 text-white shadow-[0_18px_28px_-18px_rgba(194,148,62,0.85)] transition-transform hover:scale-105 active:scale-95 dark:border-white/10"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 84px)',
            background: 'linear-gradient(135deg, rgb(var(--app-primary)), color-mix(in srgb, rgb(var(--app-primary)) 70%, #8f6522 30%))'
          }}
          onClick={() => navigate('/record')}
        >
          <Icon name="add" className="text-2xl" />
        </button>
      )}

      {chromeConfig.showTab && (
        <nav className="fixed bottom-0 z-30 w-full border-t border-[var(--ui-border-subtle-light)] bg-[color:var(--ui-surface-card-light)]/95 px-4 pb-safe pt-2 shadow-[0_-8px_32px_rgba(24,22,18,0.06)] backdrop-blur-md dark:border-[var(--ui-border-subtle-dark)] dark:bg-[color:var(--ui-surface-card-dark)]/94">
          <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
            {navItems.map((item) => {
              const active = isNavActive(item.path, item.aliases);
              return (
                <button
                  key={item.key}
                  aria-label={item.label}
                  className="group relative flex h-full flex-col items-center justify-center gap-1"
                  onClick={() => handleTabPress(item.path)}
                >
                  {active && <div className="absolute top-0 h-[3.5px] w-11 rounded-full bg-primary" />}
                  <Icon
                    name={item.icon}
                    fill={active}
                    className={`transition-colors ${active ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] group-hover:text-primary dark:text-[var(--ui-text-secondary-dark)]'}`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] group-hover:text-primary dark:text-[var(--ui-text-secondary-dark)]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

