import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { resolvePageChromeConfig } from '../src/ui/chrome';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { key: 'home', path: '/home', label: '\u9996\u9875', icon: 'home' },
  { key: 'history', path: '/history', label: '\u5386\u53f2', icon: 'calendar_month', aliases: ['/calendar'] },
  { key: 'stats', path: '/stats', label: '\u7edf\u8ba1', icon: 'bar_chart' },
  { key: 'settings', path: '/settings', label: '\u8bbe\u7f6e', icon: 'settings' }
] as const;

const triggerTabHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    } catch (error) {
      console.error('tab haptic failed:', error);
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(10);
  }
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const chromeConfig = resolvePageChromeConfig(location.pathname);
  const contentPaddingClass = chromeConfig.showFab ? 'pb-44' : chromeConfig.showTab ? 'pb-32' : 'pb-0';

  const isNavActive = (path: string, aliases?: readonly string[]) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(`${path}/`)) return true;
    return !!aliases?.some((alias) => location.pathname === alias || location.pathname.startsWith(`${alias}/`));
  };

  const handleTabPress = async (path: string) => {
    await triggerTabHaptic();
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
          className="sketch-icon-button bottom-tab-fab fixed right-5 z-40 flex size-14 items-center justify-center text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 108px)',
            transform: 'rotate(-3deg)'
          }}
          onClick={() => navigate('/record')}
        >
          <Icon name="add" size={30} className="shrink-0" />
        </button>
      )}

      {chromeConfig.showTab && (
        <nav className="bottom-tab-shell fixed bottom-0 z-30 w-full px-4 pb-safe pt-2.5">
          <div className="bottom-tab-tray mx-auto max-w-md px-2.5 pb-1.5 pt-3">
            <div className="grid grid-cols-4 items-end gap-1.5">
              {navItems.map((item, index) => {
                const active = isNavActive(item.path, item.aliases);
                const tilt = active ? (index % 2 === 0 ? '-1.4deg' : '1deg') : (index % 2 === 0 ? '-0.55deg' : '0.45deg');
                return (
                  <button
                    key={item.key}
                    aria-label={item.label}
                    className="group relative flex h-full items-end"
                    onClick={() => void handleTabPress(item.path)}
                  >
                    <div
                      className={`bottom-tab-label ${active ? 'bottom-tab-label--active' : ''}`}
                      style={{ transform: `rotate(${tilt})` }}
                    >
                      <Icon
                        name={item.icon}
                        fill={active}
                        className={`transition-colors ${active ? 'text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]' : 'text-[var(--ui-text-secondary-light)] group-hover:text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-secondary-dark)] dark:group-hover:text-[var(--ui-text-primary-dark)]'}`}
                      />
                      <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]' : 'text-[var(--ui-text-secondary-light)] group-hover:text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-secondary-dark)] dark:group-hover:text-[var(--ui-text-primary-dark)]'}`}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};
