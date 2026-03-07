import { Capacitor } from '@capacitor/core';
import { Reminder, fetchEntriesV2, fetchSettings } from '../../services';
import { getIntelligentMessage } from '../constants/notificationMessages';
import { toLocalDateString } from '../utils/date';

const CHANNEL_ID = 'mood_reminders';
const SCHEDULE_DAYS = 14;
const NOTIFICATION_BASE_ID = 500000;

const isNative = Capacitor.isNativePlatform();

const addDays = (date: Date, offset: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const reminderMatchesDate = (reminder: Reminder, date: Date) => {
  const reminderDay = date.getDay() === 0 ? 7 : date.getDay();
  return reminder.enabled && reminder.days.includes(reminderDay);
};

const buildNotificationId = (dateKey: string, reminderIndex: number) => {
  const compact = Number(dateKey.replace(/-/g, ''));
  return NOTIFICATION_BASE_ID + compact * 10 + reminderIndex;
};

const getRecentMoodAverage = async (): Promise<number | null> => {
  const start = addDays(new Date(), -2);
  const entries = await fetchEntriesV2({ startDate: toLocalDateString(start) });
  if (!entries.length) return null;
  const avg = entries.reduce((sum, entry) => sum + entry.mood_score, 0) / entries.length;
  return Number(avg.toFixed(2));
};

const ensurePermissionAndChannel = async () => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') {
    const requested = await LocalNotifications.requestPermissions();
    if (requested.display !== 'granted') return null;
  }

  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: '心情提醒',
      description: '提醒你记录当天的情绪',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true
    });
  } catch {
    // ignore channel exists
  }

  return LocalNotifications;
};

export const scheduleIntelligentNotifications = async (enabled: boolean, reminders: Reminder[]) => {
  if (!isNative) return 0;

  const LocalNotifications = await ensurePermissionAndChannel();
  if (!LocalNotifications) return 0;

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) });
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
        id: buildNotificationId(dateKey, reminderIndex),
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
  await LocalNotifications.schedule({ notifications });
  return notifications.length;
};

export const cancelTodayRemainingNotifications = async () => {
  if (!isNative) return 0;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const pending = await LocalNotifications.getPending();
  const today = toLocalDateString(new Date());
  const todayNotifications = pending.notifications.filter((item: any) => item.extra?.scheduleDate === today);

  if (!todayNotifications.length) return 0;

  await LocalNotifications.cancel({ notifications: todayNotifications.map((item) => ({ id: item.id })) });
  return todayNotifications.length;
};

export const refreshNotifications = async () => {
  if (!isNative) return 0;
  const settings = await fetchSettings();
  return scheduleIntelligentNotifications(!!settings.notification_enabled, settings.reminders || []);
};
