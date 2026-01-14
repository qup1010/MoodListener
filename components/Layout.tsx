import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/history' && (location.pathname === '/calendar')) return true;
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className="flex-1 pb-24">
        {children}
      </div>

      <nav className="fixed bottom-0 z-30 w-full bg-white dark:bg-card-dark border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between h-16 max-w-md mx-auto">
          {/* Home */}
          <button
            className="flex flex-col items-center gap-1 group w-16 relative"
            onClick={() => navigate('/home')}
          >
            {isActive('/home') && (
              <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>
            )}
            <Icon
              name="home"
              fill={isActive('/home')}
              className={`transition-colors ${isActive('/home') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}
            />
            <span className={`text-[10px] font-medium transition-colors ${isActive('/home') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}>
              首页
            </span>
          </button>

          {/* History */}
          <button
            className="flex flex-col items-center gap-1 group w-16 relative"
            onClick={() => navigate('/history')}
          >
            {isActive('/history') && (
              <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>
            )}
            <Icon
              name="calendar_month"
              fill={isActive('/history')}
              className={`transition-colors ${isActive('/history') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}
            />
            <span className={`text-[10px] font-bold transition-colors ${isActive('/history') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
              历史
            </span>
          </button>

          {/* Add Button - 突出的中心按钮 */}
          <div className="relative -top-6">
            <button
              className="flex items-center justify-center size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 ring-4 ring-background-light dark:ring-background-dark hover:scale-105 active:scale-95 transition-transform"
              onClick={() => navigate('/record')}
            >
              <Icon name="add" className="text-3xl font-bold" />
            </button>
          </div>

          {/* Stats */}
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/stats')}
          >
            {isActive('/stats') && (
              <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>
            )}
            <Icon
              name="bar_chart"
              fill={isActive('/stats')}
              className={`transition-colors ${isActive('/stats') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}
            />
            <span className={`text-[10px] font-medium transition-colors ${isActive('/stats') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}>
              统计
            </span>
          </button>

          {/* Settings */}
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/settings')}
          >
            {isActive('/settings') && (
              <div className="absolute -top-[1px] w-12 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#355c5f]"></div>
            )}
            <Icon
              name="settings"
              fill={isActive('/settings')}
              className={`transition-colors ${isActive('/settings') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}
            />
            <span className={`text-[10px] font-medium transition-colors ${isActive('/settings') ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}>
              设置
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
