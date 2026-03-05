import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

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

  const isNavActive = (path: string, aliases?: readonly string[]) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(`${path}/`)) return true;
    return !!aliases?.some((alias) => location.pathname === alias || location.pathname.startsWith(`${alias}/`));
  };

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className="flex-1 pb-24">{children}</div>

      <nav className="fixed bottom-0 z-30 w-full bg-white/95 dark:bg-card-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between h-16 max-w-md mx-auto">
          {navItems.slice(0, 2).map((item) => {
            const active = isNavActive(item.path, item.aliases);
            return (
              <button
                key={item.key}
                aria-label={item.label}
                className="flex flex-col items-center gap-1 group w-16 relative"
                onClick={() => navigate(item.path)}
              >
                {active && <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>}
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

          <div className="relative -top-6">
            <button
              aria-label="记录"
              className="flex items-center justify-center size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 ring-4 ring-background-light dark:ring-background-dark hover:scale-105 active:scale-95 transition-transform"
              onClick={() => navigate('/record')}
            >
              <Icon name="add" className="text-3xl font-bold" />
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const active = isNavActive(item.path, item.aliases);
            return (
              <button
                key={item.key}
                aria-label={item.label}
                className="flex flex-col items-center gap-1 group w-16 relative"
                onClick={() => navigate(item.path)}
              >
                {active && <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>}
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
    </div>
  );
};
