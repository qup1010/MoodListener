import React, { useEffect, useState } from 'react';
import { PermissionState } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Reminder, fetchSettings, updateSettings } from '../services';
import { refreshNotifications, scheduleNotificationsInBackground } from '../src/services/notifications';
import { confirmAction, showToast } from '../src/ui/feedback';

const WEEKDAY_LABELS = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'];
const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6, 7];

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

  const renderSwitch = (checked: boolean, onToggle: () => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation();
        void onToggle();
      }}
      className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]'}`}
    >
      <span className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  useEffect(() => {
    void loadSettings();
    void checkPermission();
  }, []);

  const checkPermission = async () => {
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
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.requestPermissions();
      setPermissionStatus(status.display);
      window.localStorage.setItem('moodlistener.notificationPermissionRequested', '1');
      if (status.display === 'granted') {
        const count = await refreshNotifications();
        if (count > 0) {
          showToast(`\u5df2\u8865\u9f50\u672a\u6765 ${count} \u6761\u63d0\u9192`, 'success', 2400);
        }
        return true;
      }
      showToast('\u672a\u83b7\u5f97\u901a\u77e5\u6743\u9650\uff0c\u65e0\u6cd5\u5f00\u542f\u5b9a\u65f6\u63d0\u9192', 'info', 2600);
      return false;
    } catch (error) {
      console.error('request notification permission failed:', error);
      showToast('\u901a\u77e5\u6743\u9650\u7533\u8bf7\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5', 'error');
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
      console.error('\u52a0\u8f7d\u63d0\u9192\u8bbe\u7f6e\u5931\u8d25:', error);
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
    if (editingReminderId) {
      setReminders((prev) => prev.map((item) => item.id === editingReminderId ? { ...item, time: tempTime, days: tempDays } : item));
    } else {
      setReminders((prev) => [...prev, { id: Date.now().toString(), time: tempTime, enabled: true, days: tempDays }]);
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
      title: '\u5220\u9664\u63d0\u9192',
      message: '\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u63d0\u9192\u65f6\u95f4\u5417\uff1f',
      confirmText: '\u5220\u9664',
      cancelText: '\u53d6\u6d88',
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
        showToast('\u63d0\u9192\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff0c\u6b63\u5728\u540e\u53f0\u66f4\u65b0\u672a\u6765 14 \u5929\u63d0\u9192', 'success', 2400);
      } else {
        showToast('\u63d0\u9192\u5df2\u5173\u95ed', 'success', 2200);
      }

      scheduleNotificationsInBackground(enabled, reminders, (count, error) => {
        if (error) {
          showToast('\u63d0\u9192\u5df2\u4fdd\u5b58\uff0c\u7cfb\u7edf\u8c03\u5ea6\u5c06\u5728\u540e\u53f0\u91cd\u8bd5', 'info', 2600);
          return;
        }

        if (enabled && typeof count === 'number') {
          showToast(`\u672a\u6765 ${count} \u6761\u63d0\u9192\u5df2\u66f4\u65b0`, 'success', 2400);
        }
      });
    } catch (error) {
      console.error('save notification settings failed:', error);
      showToast('\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5', 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        \u52a0\u8f7d\u4e2d...
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings', { replace: true })} className="flex size-10 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/60 transition-transform active:scale-[0.98] dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5">
            <Icon name="arrow_back_ios_new" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">\u5b9a\u65f6\u63d0\u9192</h1>
            <p className="page-subtitle mt-0.5">\u6309\u4f60\u8bbe\u5b9a\u7684\u65f6\u95f4\u6eda\u52a8\u5b89\u6392\u672a\u6765 14 \u5929\uff0c\u4eca\u5929\u8bb0\u8fc7\u4e86\u5c31\u4e0d\u518d\u50ac\u4f60\u3002</p>
          </div>
        </div>
      </header>

      <main className="page-content pb-32">
        {permissionStatus !== 'granted' && (
          <div className="ui-card mb-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Icon name="notifications_active" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold">\u8fd8\u6ca1\u6709\u6253\u5f00\u901a\u77e5\u6743\u9650</h3>
                <p className="text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                  \u53ea\u6709\u6253\u5f00\u7cfb\u7edf\u901a\u77e5\u540e\uff0c\u5b9a\u65f6\u63d0\u9192\u624d\u80fd\u6309\u65f6\u53d1\u51fa\u3002\u6388\u6743\u540e\u4f1a\u7acb\u5373\u8865\u9f50\u672a\u6765 14 \u5929\u63d0\u9192\u3002
                </p>
                <button onClick={() => void requestPermission()} className="ui-action-secondary mt-2 w-full !min-h-[2.4rem] text-primary">
                  \u73b0\u5728\u6388\u6743
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ui-card mb-4 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="pr-4">
              <div className="text-sm font-bold">\u5f00\u542f\u672c\u5730\u63d0\u9192</div>
              <p className="mt-1 text-xs leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                \u5728\u4f60\u5e38\u7528\u7684\u65f6\u95f4\u70b9\u8f7b\u8f7b\u63d0\u9192\u4e00\u4e0b\uff0c\u4fdd\u6301\u9891\u7387\uff0c\u53c8\u4e0d\u4f1a\u91cd\u590d\u6253\u6270\u3002
              </p>
            </div>
            {renderSwitch(enabled, handleEnabledToggle)}
          </div>
        </div>

        {enabled && (
          <>
            <div className="ui-card ui-card--subtle mb-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="ui-card-title mb-1">\u63d0\u9192\u89c4\u5219</div>
                  <p className="text-sm leading-6">\u6bcf\u6b21\u4fdd\u5b58\u540e\uff0c\u5e94\u7528\u90fd\u4f1a\u91cd\u65b0\u68c0\u67e5\u672a\u6765 14 \u5929\u7684\u65f6\u95f4\u8868\u3002\u5982\u679c\u4f60\u4eca\u5929\u5df2\u7ecf\u8bb0\u5f55\u8fc7\uff0c\u5f53\u5929\u540e\u7eed\u63d0\u9192\u4f1a\u81ea\u52a8\u8df3\u8fc7\u3002</p>
                </div>
                <button onClick={openAddEditor} className="ui-action-secondary min-h-9 px-3 text-primary">
                  <Icon name="add" size={16} />
                  \u6dfb\u52a0\u65f6\u95f4
                </button>
              </div>
            </div>

            {showEditor && (
              <div className="ui-card mb-4 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="ui-card-title mb-1">{editingReminderId ? '\u4fee\u6539\u63d0\u9192\u65f6\u95f4' : '\u6dfb\u52a0\u63d0\u9192\u65f6\u95f4'}</div>
                    <p className="text-xs leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">\u76f4\u63a5\u5728\u8fd9\u91cc\u8c03\u6574\u65f6\u95f4\u548c\u91cd\u590d\u65e5\uff0c\u4e0d\u518d\u989d\u5916\u5f39\u51fa\u62bd\u5c49\u3002</p>
                  </div>
                  <button onClick={closeEditor} className="flex size-9 items-center justify-center rounded-full bg-black/5 text-[var(--ui-text-secondary-light)] dark:bg-white/6 dark:text-[var(--ui-text-secondary-dark)]">
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="rounded-[22px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] px-4 py-4 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]">
                  <label className="ui-field-label">\u63d0\u9192\u65f6\u95f4</label>
                  <input
                    type="time"
                    value={tempTime}
                    onChange={(event) => setTempTime(event.target.value)}
                    className="mt-2 w-full border-none bg-transparent text-[2.25rem] font-black tracking-tight text-[var(--ui-text-primary-light)] outline-none dark:text-[var(--ui-text-primary-dark)]"
                  />
                </div>

                <div className="mt-4">
                  <label className="ui-field-label">\u91cd\u590d\u65e5</label>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {DEFAULT_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex h-10 items-center justify-center rounded-full text-[13px] font-bold transition-all ${tempDays.includes(day) ? 'bg-primary text-white shadow-sm' : 'bg-[var(--ui-surface-muted-light)] text-[var(--ui-text-secondary-light)] dark:bg-[var(--ui-surface-muted-dark)] dark:text-[var(--ui-text-secondary-dark)]'}`}
                      >
                        {WEEKDAY_LABELS[day - 1]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button onClick={closeEditor} className="ui-action-secondary flex-1 border-none bg-black/5 dark:bg-white/10">\u53d6\u6d88</button>
                  <button onClick={saveEditor} className="ui-action-primary flex-1">\u4fdd\u5b58\u8fd9\u4e2a\u65f6\u95f4</button>
                </div>
              </div>
            )}

            <div className="ui-card overflow-hidden">
              {reminders.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                  \u8fd8\u6ca1\u6709\u8bbe\u7f6e\u63d0\u9192\u65f6\u95f4\uff0c\u53ef\u4ee5\u5148\u6dfb\u52a0\u4e00\u4e2a\u665a\u4e0a\u6216\u7761\u524d\u65f6\u95f4\u3002
                </div>
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
                            <span key={day} className={`flex size-[1.1rem] items-center justify-center rounded-full text-[9px] font-bold ${active ? 'bg-[var(--ui-brand-primary)] text-white' : 'bg-[var(--ui-surface-muted-light)] text-[var(--ui-text-secondary-light)] opacity-45 dark:bg-[var(--ui-surface-muted-dark)] dark:text-[var(--ui-text-secondary-dark)]'}`}>
                              {WEEKDAY_LABELS[day - 1]}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-3 border-l border-[var(--ui-border-subtle-light)] pl-4 dark:border-[var(--ui-border-subtle-dark)]">
                      {renderSwitch(reminder.enabled, async () => toggleReminder(reminder.id))}
                      <button onClick={() => void deleteReminder(reminder.id)} className="flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 dark:text-primary">
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

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)]/95 pb-safe shadow-[0_-8px_32px_rgba(24,22,18,0.06)] backdrop-blur-md dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]/94">
        <div className="p-4 pt-4">
          <button onClick={handleSave} disabled={saving} className="ui-action-primary">
            {saving ? '\u6b63\u5728\u4fdd\u5b58\u8bbe\u7f6e...' : '\u4fdd\u5b58\u63d0\u9192\u8bbe\u7f6e'}
            {!saving && <Icon name="check" size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
