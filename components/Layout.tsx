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

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className={`flex-1 ${contentPaddingClass}`}>{children}</div>

      {chromeConfig.showFab && chromeConfig.fabAction === 'record' && (
        <button
          aria-label="快速记录"
          className="fixed right-5 z-40 size-12 rounded-full text-white border border-black/10 dark:border-white/10 shadow-[0_18px_28px_-18px_rgba(194,148,62,0.85)] hover:scale-105 active:scale-95 transition-transform"
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
        <nav className="fixed bottom-0 z-30 w-full backdrop-blur-md border-t border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] pb-safe pt-2 px-4 bg-[color:var(--ui-surface-card-light)]/95 dark:bg-[color:var(--ui-surface-card-dark)]/94 shadow-[0_-8px_32px_rgba(24,22,18,0.06)]">
          <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const active = isNavActive(item.path, item.aliases);
              return (
                <button
                  key={item.key}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center gap-1 group relative h-full"
                  onClick={() => navigate(item.path)}
                >
                  {active && <div className="absolute top-0 w-10 h-[2px] bg-primary rounded-full" />}
                  <Icon
                    name={item.icon}
                    fill={active}
                    className={`transition-colors ${active ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] group-hover:text-primary'}`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] group-hover:text-primary'}`}>
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