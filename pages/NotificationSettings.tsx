/**
 * 通知设置页面
 * 配置每日提醒时间（支持多时段、多周期、智能文案）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchSettings, updateSettings, Reminder } from '../services';
import { getRandomMessage } from '../src/constants/notificationMessages';
import { PermissionState } from '@capacitor/core';
import { confirmAction, showToast } from '../src/ui/feedback';

export const NotificationSettings: React.FC = () => {
    const navigate = useNavigate();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Permission state
    const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [tempTime, setTempTime] = useState('20:00');
    const [tempDays, setTempDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

    useEffect(() => {
        loadSettings();
        checkPermission();
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
                // 重新调度以确保生效
                scheduleNotifications(enabled, reminders);
            }
        } catch (error) {
            console.error('Request permission failed:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const settings = await fetchSettings();
            // 兼容旧数据：是否有旧的 notification_time
            const legacySettings = settings as any;
            if (!settings.reminders && legacySettings.notification_time) {
                const legacyReminder: Reminder = {
                    id: 'default',
                    time: legacySettings.notification_time,
                    enabled: settings.notification_enabled,
                    days: [1, 2, 3, 4, 5, 6, 7]
                };
                setReminders([legacyReminder]);
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
                reminders: reminders
            });

            await scheduleNotifications(enabled, reminders);
            navigate('/settings', { replace: true });
        } catch (error) {
            console.error('保存失败:', error);
            showToast('保存失败，请重试', 'error');
        } finally {
            setSaving(false);
        }
    };


    const scheduleNotifications = async (isEnabled: boolean, currentReminders: Reminder[]) => {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');

            console.log('[Notification] Starting schedule process...');

            // 取消所有现有通知
            const pending = await LocalNotifications.getPending();
            console.log(`[Notification] Found ${pending.notifications.length} pending notifications`);
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
                console.log('[Notification] Cancelled all pending notifications');
            }

            if (!isEnabled) {
                console.log('[Notification] Notifications disabled, exiting');
                return;
            }

            // 检查权限
            const permission = await LocalNotifications.checkPermissions();
            console.log('[Notification] Permission status:', permission.display);

            if (permission.display !== 'granted') {
                const request = await LocalNotifications.requestPermissions();
                console.log('[Notification] Permission request result:', request.display);
                if (request.display !== 'granted') {
                    console.log('[Notification] Permission denied');
                    return;
                }
            }

            // 创建通知渠道（Android 8.0+ 必需）
            try {
                await LocalNotifications.createChannel({
                    id: 'mood_reminders',
                    name: '心情提醒',
                    description: '定时提醒记录心情',
                    importance: 4, // High importance
                    visibility: 1,
                    sound: 'default',
                    vibration: true
                });
                console.log('[Notification] Channel created successfully');
            } catch (channelError) {
                console.log('[Notification] Channel creation error (may already exist):', channelError);
            }

            const notificationsToSchedule = [];
            let idCounter = 100; // 起始 ID

            for (const reminder of currentReminders) {
                if (!reminder.enabled) continue;

                const [hours, minutes] = reminder.time.split(':').map(Number);
                console.log(`[Notification] Processing reminder: ${reminder.time}, days:`, reminder.days);

                // 为每个启用的星期几创建一个单独的通知调度
                for (const day of reminder.days) {
                    // LocalNotifications 的 weekday 是 1 (周日) 到 7 (周六)
                    // 我们的 days 是 1 (周一) 到 7 (周日)
                    // 转换映射: 
                    // Mon(1) -> 2, Tue(2) -> 3, ..., Sat(6) -> 7, Sun(7) -> 1
                    const weekday = day === 7 ? 1 : day + 1;

                    const message = getRandomMessage(hours);

                    notificationsToSchedule.push({
                        id: idCounter++,
                        title: 'MoodListener',
                        body: message,
                        channelId: 'mood_reminders',
                        schedule: {
                            on: {
                                hour: hours,
                                minute: minutes,
                                weekday: weekday
                            },
                            allowWhileIdle: true,
                            repeats: true // 重要：设置为重复
                        },
                        sound: 'default',
                        smallIcon: 'ic_stat_mood',
                        actionTypeId: 'RECORD_ACTION',
                        extra: {
                            path: '/record'
                        }
                    });
                }
            }

            console.log(`[Notification] Scheduling ${notificationsToSchedule.length} notifications`);

            if (notificationsToSchedule.length > 0) {
                await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                console.log('[Notification] Schedule successful!');

                // 验证调度
                const newPending = await LocalNotifications.getPending();
                console.log(`[Notification] Verified: ${newPending.notifications.length} notifications scheduled`);
                showToast(`已成功设置 ${newPending.notifications.length} 个提醒`, 'success', 2600);
            } else {
                console.log('[Notification] No notifications to schedule');
                showToast('没有启用的提醒', 'info');
            }

        } catch (error) {
            console.error('[Notification] Schedule failed:', error);
            showToast(`设置通知失败: ${error}`, 'error', 2800);
        }
    };

    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
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
        setReminders(prev => prev.filter(r => r.id !== id));
    };

    const openAddModal = () => {
        setEditingReminder(null);
        setTempTime('08:00');
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
            // Edit
            setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...r, time: tempTime, days: tempDays } : r));
        } else {
            // Add
            const newReminder: Reminder = {
                id: Date.now().toString(),
                time: tempTime,
                enabled: true,
                days: tempDays
            };
            setReminders(prev => [...prev, newReminder]);
        }
        setShowModal(false);
    };

    const toggleDay = (day: number) => {
        if (tempDays.includes(day)) {
            if (tempDays.length === 1) return; // 至少保留一天
            setTempDays(prev => prev.filter(d => d !== day));
        } else {
            setTempDays(prev => [...prev, day].sort());
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <span className="text-gray-500">加载中...</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100">
            <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <button onClick={() => navigate('/settings', { replace: true })} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <Icon name="arrow_back_ios_new" className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-lg font-bold">定时提醒</h1>
                <button onClick={openAddModal} className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary/10">
                    <Icon name="add" className="text-2xl" />
                </button>
            </header>

            <main className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto w-full">

                {/* 权限引导卡片 */}
                {permissionStatus !== 'granted' && (
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <Icon name="notifications_off" className="text-primary text-xl" />
                            <h3 className="font-bold text-primary">开启通知权限</h3>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            为了让你不错过每日的记录提醒，MoodListener 需要获取系统的通知权限。我们承诺仅用于发送你设定的心情提醒。
                        </p>
                        <button
                            onClick={requestPermission}
                            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            允许通知
                        </button>
                    </div>
                )}


                {/* 总开关 */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Icon name="notifications_active" className="text-2xl" />
                        </div>
                        <div>
                            <span className="font-semibold block">开启提醒</span>
                            <span className="text-xs text-gray-500 block">不错过每一次记录</span>
                        </div>
                    </div>
                    <div
                        className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={() => setEnabled(!enabled)}
                    >
                        <div className={`absolute top-1 left-1 size-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {/* 提醒列表 */}
                {enabled && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase px-2">我的提醒</h3>
                        {reminders.map(reminder => (
                            <div key={reminder.id} className="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex-1 cursor-pointer" onClick={() => openEditModal(reminder)}>
                                    <div className="text-3xl font-bold font-mono tracking-tight text-primary">{reminder.time}</div>
                                    <div className="flex gap-1 mt-2">
                                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <span key={d} className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${reminder.days.includes(d) ? 'bg-primary/10 text-primary font-bold' : 'text-gray-300 dark:text-gray-600'}`}>
                                                {['一', '二', '三', '四', '五', '六', '日'][d - 1]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-700 pl-4 ml-2">
                                    <div
                                        className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${reminder.enabled ? 'bg-primary/80' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        onClick={() => toggleReminder(reminder.id)}
                                    >
                                        <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform ${reminder.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <button onClick={() => void deleteReminder(reminder.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Icon name="delete" size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={openAddModal}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="add" />
                            添加新提醒
                        </button>
                    </div>
                )}
            </main>

            {/* 保存按钮 */}
            <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {saving ? '保存中...' : '保存设置'}
                    {!saving && <Icon name="check" />}
                </button>
            </div>

            {/* 编辑/添加 Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full sm:w-[400px] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
                        <h3 className="text-xl font-bold mb-6 text-center">{editingReminder ? '编辑提醒' : '添加提醒'}</h3>

                        <div className="flex justify-center mb-8">
                            <input
                                type="time"
                                value={tempTime}
                                onChange={(e) => setTempTime(e.target.value)}
                                className="text-5xl font-bold bg-transparent border-none text-center focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        <div className="mb-8">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block text-center">重复周期</label>
                            <div className="flex justify-between px-2 gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => toggleDay(d)}
                                        className={`size-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${tempDays.includes(d)
                                            ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {['一', '二', '三', '四', '五', '六', '日'][d - 1]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveModal}
                                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};








