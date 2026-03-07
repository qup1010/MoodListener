export const APP_LOCK_MIN_LENGTH = 4;
export const APP_LOCK_MAX_LENGTH = 20;

export const normalizeAppLockPassword = (value: string): string => value.trim();

export const isValidAppLockPassword = (value: string): boolean => {
  const normalized = normalizeAppLockPassword(value);
  return normalized.length >= APP_LOCK_MIN_LENGTH && normalized.length <= APP_LOCK_MAX_LENGTH;
};

export const hashAppLockPassword = async (value: string): Promise<string> => {
  const normalized = normalizeAppLockPassword(value);
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('');
};
