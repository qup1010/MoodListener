import React, { useEffect, useState } from 'react';
import { Capacitor, PermissionState } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Reminder, fetchSettings, updateSettings } from '../services';
import { refreshNotifications, scheduleNotificationsInBackground } from '../src/services/notifications';
import { confirmAction, showToast } from '../src/ui/feedback';

const WEEKDAY_LABELS = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'];
const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6, 7];
const isNative = Capacitor.isNativePlatform();

const copy = {
  loading: '\u52a0\u8f7d\u4e2d...',
  title: '\u5b9a\u65f6\u63d0\u9192',
  subtitle: '\u6309\u4f60\u8bbe\u5b9a\u7684\u65f6\u95f4\u63d0\u9192\uff0c\u4eca\u5929\u8bb0\u8fc7\u5c31\u4e0d\u518d\u6253\u6270\u3002',
  permissionTitle: '\u8fd8\u6ca1\u6709\u6253\u5f00\u901a\u77e5\u6743\u9650',
  permissionBody: '\u6253\u5f00\u7cfb\u7edf\u901a\u77e5\u540e\uff0c\u63d0\u9192\u624d\u80fd\u6b63\u5e38\u53d1\u51fa\u3002',
  permissionAction: '\u73b0\u5728\u6388\u6743',
  toggleTitle: '\u5f00\u542f\u672c\u5730\u63d0\u9192',
  toggleBody: '\u5728\u4f60\u9009\u7684\u65f6\u95f4\u63d0\u9192\u4e00\u4e0b\u3002',
  rulesTitle: '\u63d0\u9192\u8bf4\u660e',
  rulesBody: '\u4eca\u5929\u8bb0\u8fc7\u4e4b\u540e\uff0c\u5f53\u5929\u5c31\u4e0d\u4f1a\u518d\u63d0\u9192\u3002',
  addTime: '\u6dfb\u52a0\u65f6\u95f4',
  editTime: '\u4fee\u6539\u63d0\u9192\u65f6\u95f4',
  createTime: '\u6dfb\u52a0\u63d0\u9192\u65f6\u95f4',
  inlineHint: '\u5728\u8fd9\u91cc\u76f4\u63a5\u8c03\u6574\u65f6\u95f4\u548c\u91cd\u590d\u65e5\u3002',
  timeLabel: '\u63d0\u9192\u65f6\u95f4',
  daysLabel: '\u91cd\u590d\u65e5',
  cancel: '\u53d6\u6d88',
  saveThisTime: '\u4fdd\u5b58\u8fd9\u4e2a\u65f6\u95f4',
  empty: '\u8fd8\u6ca1\u6709\u8bbe\u7f6e\u63d0\u9192\u65f6\u95f4\u3002',
  saveButton: '\u4fdd\u5b58\u63d0\u9192',
  savingButton: '\u6b63\u5728\u4fdd\u5b58...',
  deleteTitle: '\u5220\u9664\u63d0\u9192',
  deleteMessage: '\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u63d0\u9192\u65f6\u95f4\u5417\uff1f',
  deleteText: '\u5220\u9664',
  enabledSaved: '\u63d0\u9192\u8bbe\u7f6e\u5df2\u4fdd\u5b58',
  disabledSaved: '\u63d0\u9192\u5df2\u5173\u95ed',
  retryScheduling: '\u63d0\u9192\u5df2\u4fdd\u5b58',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  noActiveReminder: '\u8bf7\u81f3\u5c11\u4fdd\u7559\u4e00\u4e2a\u5df2\u5f00\u542f\u7684\u63d0\u9192\u65f6\u95f4',
  noPermission: '\u672a\u83b7\u5f97\u901a\u77e5\u6743\u9650\uff0c\u65e0\u6cd5\u5f00\u542f\u5b9a\u65f6\u63d0\u9192',
  permissionFailed: '\u901a\u77e5\u6743\u9650\u7533\u8bf7\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  futureUpdated: (count: number) => `\u5df2\u66f4\u65b0 ${count} \u6761\u63d0\u9192`,
  permissionUpdated: (count: number) => `\u5df2\u51c6\u5907\u597d ${count} \u6761\u63d0\u9192`
};

export const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [showEditor, setShowEditor] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState('20:00');
  const [tempDays, setTempDays] = useState<number[]>(DEFAULT_DAYS);

  const renderSwitch = (checked: boolean, onToggle: () => void | Promise<void>) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation();
        void onToggle();
      }}
      className={`relative inline-flex h-7 w-12 items-center rounded-[11px] border-2 border-dashed p-1 transition-colors ${checked ? 'border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)]' : 'border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]'}`}
      style={{ transform: checked ? 'rotate(-1.4deg)' : 'rotate(0.7deg)' }}
    >
      <span className={`block size-5 rounded-[8px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-page-light)] shadow-[1px_1px_0_rgba(44,44,44,0.12)] transition-transform dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-page-dark)] ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  useEffect(() => {
    void loadSettings();
    void checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!isNative) {
      setPermissionStatus('granted');
      return 'granted' as PermissionState;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.checkPermissions();
      setPermissionStatus(status.display);
      return status.display;
    } catch (error) {
      console.error('check notification permission failed:', error);
      return 'prompt' as PermissionState;
    }
  };

  const requestPermission = async () => {
    if (!isNative) {
      setPermissionStatus('granted');
      return true;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.requestPermissions();
      setPermissionStatus(status.display);
      window.localStorage.setItem('moodlistener.notificationPermissionRequested', '1');
      if (status.display === 'granted') {
        const count = await refreshNotifications();
        if (count > 0) {
          showToast(copy.permissionUpdated(count), 'success', 2400);
        }
        return true;
      }
      showToast(copy.noPermission, 'info', 2600);
      return false;
    } catch (error) {
      console.error('request notification permission failed:', error);
      showToast(copy.permissionFailed, 'error');
      return false;
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await fetchSettings();
      const legacySettings = settings as typeof settings & { notification_time?: string };
      if ((!settings.reminders || settings.reminders.length === 0) && legacySettings.notification_time) {
        setReminders([{ id: 'default', time: legacySettings.notification_time, enabled: settings.notification_enabled, days: DEFAULT_DAYS }]);
      } else {
        setReminders(settings.reminders || []);
      }
      setEnabled(settings.notification_enabled);
    } catch (error) {
      console.error('load notification settings failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddEditor = () => {
    setEditingReminderId(null);
    setTempTime('20:00');
    setTempDays(DEFAULT_DAYS);
    setShowEditor(true);
  };

  const openEditEditor = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);
    setTempTime(reminder.time);
    setTempDays(reminder.days);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingReminderId(null);
    setTempTime('20:00');
    setTempDays(DEFAULT_DAYS);
  };

  const saveEditor = () => {
    const normalizedDays = [...tempDays].sort((a, b) => a - b);
    const duplicate = reminders.some((item) => {
      if (item.id === editingReminderId) return false;
      return item.time === tempTime && item.days.length === normalizedDays.length && item.days.every((day, index) => day === normalizedDays[index]);
    });

    if (duplicate) {
      showToast('这个提醒时间已经存在了', 'info', 2400);
      return;
    }

    if (editingReminderId) {
      setReminders((prev) => prev.map((item) => item.id === editingReminderId ? { ...item, time: tempTime, days: normalizedDays } : item));
    } else {
      setReminders((prev) => [...prev, { id: Date.now().toString(), time: tempTime, enabled: true, days: normalizedDays }]);
    }
    closeEditor();
  };

  const toggleDay = (day: number) => {
    if (tempDays.includes(day)) {
      if (tempDays.length === 1) return;
      setTempDays((prev) => prev.filter((item) => item !== day));
      return;
    }
    setTempDays((prev) => [...prev, day].sort());
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const deleteReminder = async (id: string) => {
    const ok = await confirmAction({
      title: copy.deleteTitle,
      message: copy.deleteMessage,
      confirmText: copy.deleteText,
      cancelText: copy.cancel,
      danger: false
    });
    if (!ok) return;
    setReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEnabledToggle = async () => {
    if (enabled) {
      setEnabled(false);
      return;
    }

    const nextStatus = permissionStatus === 'granted' ? 'granted' : await checkPermission();
    if (nextStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setEnabled(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (enabled && reminders.every((item) => !item.enabled)) {
        showToast(copy.noActiveReminder, 'info', 2400);
        setSaving(false);
        return;
      }

      if (enabled && permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setSaving(false);
          return;
        }
      }

      await updateSettings({
        notification_enabled: enabled,
        reminders
      });

      setSaving(false);
      navigate('/settings', { replace: true });

      if (enabled) {
        showToast(copy.enabledSaved, 'success', 2400);
      } else {
        showToast(copy.disabledSaved, 'success', 2200);
      }

      scheduleNotificationsInBackground(enabled, reminders, (count, error) => {
        if (error) {
          showToast(copy.retryScheduling, 'info', 2600);
          return;
        }

        if (enabled && typeof count === 'number') {
          showToast(copy.futureUpdated(count), 'success', 2400);
        }
      });
    } catch (error) {
      console.error('save notification settings failed:', error);
      showToast(copy.saveFailed, 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        {copy.loading}
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings', { replace: true })} className="sketch-icon-button flex size-10 items-center justify-center">
            <Icon name="arrow_back_ios_new" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{copy.title}</h1>
            <p className="page-subtitle mt-0.5">{copy.subtitle}</p>
          </div>
        </div>
      </header>

      <main className="page-content pb-32">
        {isNative && permissionStatus !== 'granted' && (
          <div className="ui-card mb-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] text-primary shadow-[2px_2px_0_rgba(44,44,44,0.08)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
                <Icon name="notifications_active" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold">{copy.permissionTitle}</h3>
                <p className="text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{copy.permissionBody}</p>
                <button onClick={() => void requestPermission()} className="ui-action-secondary mt-2 w-full !min-h-[2.4rem] text-primary">
                  {copy.permissionAction}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ui-card mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="pr-4">
              <div className="text-sm font-bold">{copy.toggleTitle}</div>
              <p className="mt-1 text-xs leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{copy.toggleBody}</p>
            </div>
            {renderSwitch(enabled, handleEnabledToggle)}
          </div>
        </div>

        {enabled && (
          <>
            <div className="ui-card ui-card--subtle mb-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="ui-card-title mb-1">{copy.rulesTitle}</div>
                  <p className="text-sm leading-6">{copy.rulesBody}</p>
                </div>
                <button onClick={openAddEditor} className="ui-action-secondary min-h-9 px-3 text-primary">
                  <Icon name="add" size={16} />
                  {copy.addTime}
                </button>
              </div>
            </div>

            {showEditor && (
              <div className="ui-card mb-4 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="ui-card-title mb-1">{editingReminderId ? copy.editTime : copy.createTime}</div>
                    <p className="text-xs leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{copy.inlineHint}</p>
                  </div>
                  <button onClick={closeEditor} className="sketch-icon-button flex size-9 items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] px-4 py-4 shadow-[2px_2px_0_rgba(44,44,44,0.1)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]">
                  <label className="ui-field-label">{copy.timeLabel}</label>
                  <input
                    type="time"
                    value={tempTime}
                    onChange={(event) => setTempTime(event.target.value)}
                    className="mt-2 w-full border-none bg-transparent text-[2.25rem] font-black tracking-tight text-[var(--ui-text-primary-light)] outline-none dark:text-[var(--ui-text-primary-dark)]"
                  />
                </div>

                <div className="mt-4">
                  <label className="ui-field-label">{copy.daysLabel}</label>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {DEFAULT_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`sketch-chip h-10 justify-center px-0 ${tempDays.includes(day) ? 'sketch-chip--active' : ''}`}
                      >
                        {WEEKDAY_LABELS[day - 1]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button onClick={closeEditor} className="ui-action-secondary flex-1">{copy.cancel}</button>
                  <button onClick={saveEditor} className="ui-action-primary flex-1">{copy.saveThisTime}</button>
                </div>
              </div>
            )}

            <div className="ui-card overflow-hidden">
              {reminders.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{copy.empty}</div>
              ) : (
                reminders.map((reminder, index) => (
                  <div key={reminder.id} className={`flex items-center p-4 ${index !== reminders.length - 1 ? 'border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]' : ''}`}>
                    <button type="button" className="min-w-0 flex-1 pr-4 text-left" onClick={() => openEditEditor(reminder)}>
                      <div className="text-3xl font-black tracking-tight" style={{ color: reminder.enabled ? 'var(--ui-brand-primary)' : 'var(--ui-text-secondary-light)' }}>
                        {reminder.time}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {DEFAULT_DAYS.map((day) => {
                          const active = reminder.days.includes(day);
                          return (
                            <span key={day} className={`sketch-chip !min-h-0 !px-0 !py-0 flex size-[1.4rem] items-center justify-center text-[9px] font-bold ${active ? 'sketch-chip--active' : 'opacity-55'}`}>
                              {WEEKDAY_LABELS[day - 1]}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-3 border-l border-[var(--ui-border-subtle-light)] pl-4 dark:border-[var(--ui-border-subtle-dark)]">
                      {renderSwitch(reminder.enabled, () => toggleReminder(reminder.id))}
                      <button onClick={() => void deleteReminder(reminder.id)} className="sketch-icon-button flex size-8 items-center justify-center text-[var(--ui-brand-primary-strong)] dark:text-[var(--ui-brand-primary)]">
                        <Icon name="delete" size={18} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] pb-safe dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
        <div className="p-4 pt-4">
          <button onClick={handleSave} disabled={saving} className="ui-action-primary">
            {saving ? copy.savingButton : copy.saveButton}
            {!saving && <Icon name="check" size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
