import { Capacitor } from '@capacitor/core';
import { Reminder, fetchEntriesV2, fetchSettings } from '../../services';
import { getIntelligentMessage } from '../constants/notificationMessages';
import { createLocalNotificationClient, type LocalNotificationClient } from './localNotificationClient';
import { toLocalDateString } from '../utils/date';

const CHANNEL_ID = 'mood_reminders';
const SCHEDULE_DAYS = 60;
const NOTIFICATION_BASE_ID = 500000;
const NATIVE_TIMEOUT_MS = 4500;

const isNative = Capacitor.isNativePlatform();

const addDays = (date: Date, offset: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const withTimeout = async <T,>(task: Promise<T>, label: string): Promise<T> => {
  return await Promise.race([
    task,
    new Promise<T>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`${label} timed out`)), NATIVE_TIMEOUT_MS);
    })
  ]);
};

const reminderMatchesDate = (reminder: Reminder, date: Date) => {
  const reminderDay = date.getDay() === 0 ? 7 : date.getDay();
  return reminder.enabled && reminder.days.includes(reminderDay);
};

const buildNotificationId = (dayOffset: number, reminderIndex: number) => {
  return NOTIFICATION_BASE_ID + dayOffset * 1000 + reminderIndex;
};

const getRecentMoodAverage = async (): Promise<number | null> => {
  const start = addDays(new Date(), -2);
  const entries = await fetchEntriesV2({ startDate: toLocalDateString(start) });
  if (!entries.length) return null;
  const avg = entries.reduce((sum, entry) => sum + entry.mood_score, 0) / entries.length;
  return Number(avg.toFixed(2));
};

const getLocalNotificationClient = async (): Promise<LocalNotificationClient> => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return createLocalNotificationClient(LocalNotifications as unknown as LocalNotificationClient);
};

const ensurePermissionAndChannel = async (requestPermission = true) => {
  const client = await getLocalNotificationClient();
  const permission = await withTimeout(client.checkPermissions(), 'checkPermissions');
  if (permission.display !== 'granted') {
    if (!requestPermission) return null;
    const requested = await withTimeout(client.requestPermissions(), 'requestPermissions');
    if (requested.display !== 'granted') return null;
  }

  try {
    await withTimeout(client.createChannel({
      id: CHANNEL_ID,
      name: '\u5fc3\u60c5\u63d0\u9192',
      description: '\u63d0\u9192\u4f60\u8bb0\u5f55\u5f53\u5929\u7684\u60c5\u7eea',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true
    }), 'createChannel');
  } catch {
    // ignore channel exists or native no-op
  }

  return client;
};

export const scheduleIntelligentNotifications = async (
  enabled: boolean,
  reminders: Reminder[],
  options?: { requestPermission?: boolean }
) => {
  if (!isNative) return 0;

  const LocalNotifications = await ensurePermissionAndChannel(options?.requestPermission ?? true);
  if (!LocalNotifications) return 0;

  const pending = await withTimeout(LocalNotifications.getPending(), 'getPending');
  if (pending.notifications.length > 0) {
    await withTimeout(
      LocalNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) }),
      'cancelPending'
    );
  }

  if (!enabled) return 0;

  const recentMood = await getRecentMoodAverage();
  const now = new Date();
  const notifications: any[] = [];

  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const date = addDays(now, dayOffset);
    const dateKey = toLocalDateString(date);

    reminders.forEach((reminder, reminderIndex) => {
      if (!reminderMatchesDate(reminder, date)) return;

      const [hours, minutes] = reminder.time.split(':').map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      if (scheduledAt <= now) return;

      notifications.push({
        id: buildNotificationId(dayOffset, reminderIndex),
        title: 'MoodListener',
        body: getIntelligentMessage(hours, scheduledAt, recentMood),
        channelId: CHANNEL_ID,
        schedule: {
          at: scheduledAt,
          allowWhileIdle: true
        },
        sound: 'default',
        smallIcon: 'ic_stat_mood',
        actionTypeId: 'RECORD_ACTION',
        extra: {
          path: '/record',
          scheduleDate: dateKey
        }
      });
    });
  }

  if (!notifications.length) return 0;
  await withTimeout(LocalNotifications.schedule({ notifications }), 'scheduleNotifications');
  return notifications.length;
};

export const scheduleNotificationsInBackground = (
  enabled: boolean,
  reminders: Reminder[],
  onSettled?: (count: number | null, error?: unknown) => void
) => {
  if (!isNative) {
    onSettled?.(0);
    return;
  }

  void scheduleIntelligentNotifications(enabled, reminders)
    .then((count) => onSettled?.(count))
    .catch((error) => {
      console.error('background notification scheduling failed:', error);
      onSettled?.(null, error);
    });
};

export const cancelTodayRemainingNotifications = async () => {
  if (!isNative) return 0;
  const client = await getLocalNotificationClient();
  const pending = await withTimeout(client.getPending(), 'getPending');
  const today = toLocalDateString(new Date());
  const todayNotifications = pending.notifications.filter((item: any) => item.extra?.scheduleDate === today);

  if (!todayNotifications.length) return 0;

  await withTimeout(
    client.cancel({ notifications: todayNotifications.map((item) => ({ id: item.id })) }),
    'cancelTodayNotifications'
  );
  return todayNotifications.length;
};

export const refreshNotifications = async () => {
  if (!isNative) return 0;
  const settings = await fetchSettings();
  return scheduleIntelligentNotifications(!!settings.notification_enabled, settings.reminders || []);
};

export const refreshNotificationsIfAuthorized = async () => {
  if (!isNative) return 0;
  const settings = await fetchSettings();
  return scheduleIntelligentNotifications(!!settings.notification_enabled, settings.reminders || [], {
    requestPermission: false
  });
};
