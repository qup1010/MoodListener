export interface PageChromeConfig {
  showTab: boolean;
  showFab: boolean;
  fabAction: 'record' | 'none';
}

export const resolvePageChromeConfig = (pathname: string): PageChromeConfig => {
  const primaryRoutes = ['/home', '/history', '/calendar', '/stats', '/settings'];
  const isPrimaryRoute = primaryRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isPrimaryRoute) {
    return {
      showTab: false,
      showFab: false,
      fabAction: 'none'
    };
  }

  const isHome = pathname === '/home';

  return {
    showTab: true,
    showFab: !isHome,
    fabAction: !isHome ? 'record' : 'none'
  };
};
