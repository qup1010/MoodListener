import React, { useEffect, useState } from 'react';
import { PermissionState } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Reminder, fetchSettings, updateSettings } from '../services';
import { refreshNotifications, scheduleIntelligentNotifications } from '../src/services/notifications';
import { confirmAction, showToast } from '../src/ui/feedback';

export const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [tempTime, setTempTime] = useState('20:00');
  const [tempDays, setTempDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const renderSwitch = (checked: boolean, onToggle: () => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-[var(--ui-surface-muted-light)] border border-[var(--ui-border-subtle-light)] dark:bg-[var(--ui-surface-muted-dark)] dark:border-[var(--ui-border-subtle-dark)]'}`}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
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
    } catch (error) {
      console.error('Check permission failed:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.requestPermissions();
      setPermissionStatus(status.display);
      if (status.display === 'granted') {
        const count = await refreshNotifications();
        if (count > 0) {
          showToast(`已更新未来 ${count} 条提醒`, 'success', 2600);
        }
      }
    } catch (error) {
      console.error('Request permission failed:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await fetchSettings();
      const legacySettings = settings as any;
      if ((!settings.reminders || settings.reminders.length === 0) && legacySettings.notification_time) {
        setReminders([{ id: 'default', time: legacySettings.notification_time, enabled: settings.notification_enabled, days: [1, 2, 3, 4, 5, 6, 7] }]);
      } else {
        setReminders(settings.reminders || []);
      }
      setEnabled(settings.notification_enabled);
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        notification_enabled: enabled,
        reminders
      });

      const count = await scheduleIntelligentNotifications(enabled, reminders);
      if (enabled) {
        showToast(`已重排未来 ${count} 条提醒`, 'success', 2600);
      } else {
        showToast('提醒已关闭', 'success', 2200);
      }
      navigate('/settings', { replace: true });
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const deleteReminder = async (id: string) => {
    const ok = await confirmAction({
      title: '删除提醒',
      message: '确定要删除这个提醒吗？',
      confirmText: '删除',
      cancelText: '取消',
      danger: true
    });
    if (!ok) return;
    setReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setTempTime('20:00');
    setTempDays([1, 2, 3, 4, 5, 6, 7]);
    setShowModal(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setTempTime(reminder.time);
    setTempDays(reminder.days);
    setShowModal(true);
  };

  const saveModal = () => {
    if (editingReminder) {
      setReminders((prev) => prev.map((item) => item.id === editingReminder.id ? { ...item, time: tempTime, days: tempDays } : item));
    } else {
      setReminders((prev) => [...prev, { id: Date.now().toString(), time: tempTime, enabled: true, days: tempDays }]);
    }
    setShowModal(false);
  };

  const toggleDay = (day: number) => {
    if (tempDays.includes(day)) {
      if (tempDays.length === 1) return;
      setTempDays((prev) => prev.filter((item) => item !== day));
      return;
    }
    setTempDays((prev) => [...prev, day].sort());
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        加载中...
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings', { replace: true })} className="flex size-10 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/60 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5 transition-transform active:scale-[0.98]">
            <Icon name="arrow_back_ios_new" size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">定时提醒</h1>
            <p className="page-subtitle mt-0.5">未来 14 天会动态更新，不再是重复不变的机械提醒。</p>
          </div>
        </div>
      </header>

      <main className="page-content pb-28">
        {permissionStatus !== 'granted' && (
          <div className="ui-card ui-card--danger mb-4 p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Icon name="notifications_off" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-red-600 dark:text-red-400">系统通知权限尚未开启</h3>
                <p className="text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                  开启后，应用会动态生成未来 14 天的本地提醒，并根据心情状态做轻微变化，不会上传任何个人内容。
                </p>
                <button onClick={requestPermission} className="ui-action-secondary mt-2 w-full !min-h-[2.4rem] text-red-600 dark:text-red-400">
                  去授权
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 ui-card overflow-hidden">
          <div className="flex cursor-pointer items-center justify-between p-4 transition-colors active:bg-black/5 dark:active:bg-white/5" onClick={() => setEnabled(!enabled)}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <Icon name="notifications_active" className="text-[22px]" />
              </div>
              <div>
                <span className="block font-semibold">开启本地提醒</span>
                <span className="block text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">打开后会动态规划未来 14 天提醒，并自动跳过当天已完成记录后的催促。</span>
              </div>
            </div>
            {renderSwitch(enabled, () => setEnabled(!enabled))}
          </div>
        </div>

        {enabled && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">提醒时段</div>
              <button onClick={openAddModal} className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:scale-110 active:scale-95">
                <Icon name="add" size={18} />
              </button>
            </div>
            <div className="ui-card overflow-hidden">
              {reminders.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                  还没有设置任何提醒时间
                </div>
              ) : (
                reminders.map((reminder, index) => (
                  <div key={reminder.id} className={`flex items-center p-4 ${index !== reminders.length - 1 ? 'border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]' : ''}`}>
                    <div className="min-w-0 flex-1 cursor-pointer pr-4" onClick={() => openEditModal(reminder)}>
                      <div className="text-3xl font-black tracking-tight" style={{ color: reminder.enabled ? 'var(--ui-brand-primary)' : 'var(--ui-text-secondary-light)' }}>
                        {reminder.time}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                          const active = reminder.days.includes(day);
                          return (
                            <span key={day} className={`flex size-[1.1rem] items-center justify-center rounded-full text-[9px] font-bold ${active ? 'bg-[var(--ui-brand-primary)] text-white' : 'bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] opacity-40'}`}>
                              {['一', '二', '三', '四', '五', '六', '日'][day - 1]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 border-l border-[var(--ui-border-subtle-light)] pl-4 dark:border-[var(--ui-border-subtle-dark)]">
                      {renderSwitch(reminder.enabled, () => toggleReminder(reminder.id))}
                      <button onClick={() => void deleteReminder(reminder.id)} className="flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 dark:text-primary">
                        <Icon name="delete" size={18} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)]/95 pb-safe shadow-[0_-8px_32px_rgba(24,22,18,0.06)] backdrop-blur-md dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]/94">
        <div className="p-4 pt-4">
          <button onClick={handleSave} disabled={saving} className="ui-action-primary">
            {saving ? '正在重排未来提醒...' : '保存更改并生效'}
            {!saving && <Icon name="check" size={20} />}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in sm:items-center" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-[var(--ui-surface-card-light)] p-6 shadow-[var(--ui-elevation-hero)] animate-in slide-in-from-bottom dark:bg-[var(--ui-surface-card-dark)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 text-center">
              <h3 className="text-xl font-extrabold">{editingReminder ? '修改提醒时段' : '添加提醒时段'}</h3>
              <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">动态提醒会沿着这个时间，持续补齐未来 14 天。</p>
            </div>

            <div className="mx-8 mb-8 flex justify-center rounded-2xl py-4 ui-card ui-card--subtle !border-none">
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="border-none bg-transparent text-[2.8rem] font-black text-[var(--ui-text-primary-light)] focus:outline-none focus:ring-0 dark:text-[var(--ui-text-primary-dark)]"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="mb-8 px-2">
              <label className="mb-3 block text-center text-xs font-bold uppercase text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">重复日</label>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`mx-auto flex size-10 items-center justify-center rounded-full text-[13px] font-bold transition-all ${tempDays.includes(day) ? 'scale-110 bg-primary text-white shadow-sm' : 'bg-[var(--ui-surface-muted-light)] text-[var(--ui-text-secondary-light)] dark:bg-[var(--ui-surface-muted-dark)] dark:text-[var(--ui-text-secondary-dark)]'}`}
                  >
                    {['一', '二', '三', '四', '五', '六', '日'][day - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="ui-action-secondary flex-1 border-none bg-black/5 dark:bg-white/10">
                取消
              </button>
              <button onClick={saveModal} className="ui-action-primary flex-1">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
