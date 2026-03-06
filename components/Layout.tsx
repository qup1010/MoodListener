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
          className="fixed right-5 z-40 size-12 rounded-full bg-primary text-white border border-black/10 dark:border-white/10 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
          onClick={() => navigate('/record')}
        >
          <Icon name="add" className="text-2xl" />
        </button>
      )}

      {chromeConfig.showTab && (
        <nav className="fixed bottom-0 z-30 w-full bg-white/95 dark:bg-card-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
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
                    className={`transition-colors ${active ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}
                  />
                  <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary font-bold' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}>
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

