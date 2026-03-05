export const getInitialAvatarDataUrl = (name: string, background = '#3b82f6'): string => {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${background}" />
  <text x="64" y="74" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="44" font-weight="700">${initial}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
