/**
 * 通知设置页面
 * 配置每日提醒时间
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchSettings, updateSettings } from '../services';

export const NotificationSettings: React.FC = () => {
    const navigate = useNavigate();
    const [enabled, setEnabled] = useState(true);
    const [time, setTime] = useState('20:00');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await fetchSettings();
            setEnabled(settings.notification_enabled);
            setTime(settings.notification_time);
        } catch (error) {
            console.error('加载设置失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 保存设置
            await updateSettings({
                notification_enabled: enabled,
                notification_time: time
            });

            // 设置/取消本地通知
            await scheduleNotification(enabled, time);

            navigate(-1);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const scheduleNotification = async (isEnabled: boolean, notificationTime: string) => {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');

            // 先取消现有的提醒
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

            if (!isEnabled) return;

            // 请求通知权限
            const permission = await LocalNotifications.requestPermissions();
            if (permission.display !== 'granted') {
                alert('需要通知权限才能设置提醒');
                return;
            }

            // 解析时间
            const [hours, minutes] = notificationTime.split(':').map(Number);

            // 计算下一次通知时间
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // 如果今天的时间已过，则设置为明天
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            // 设置每日重复通知
            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: 1,
                        title: '记录今天的心情',
                        body: '花一分钟记录下此刻的感受吧 🌟',
                        schedule: {
                            at: scheduledTime,
                            repeats: true,
                            every: 'day'
                        },
                        sound: 'default',
                        smallIcon: 'ic_stat_mood',
                        largeIcon: 'ic_launcher'
                    }
                ]
            });

        } catch (error) {
            console.error('设置通知失败:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
            <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-[#121617] dark:text-white" />
                </button>
                <h1 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">定时提醒</h1>
                <div className="size-10 shrink-0"></div>
            </header>

            <main className="px-4 py-6 flex flex-col gap-6">
                {/* 提醒开关 */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                        onClick={() => setEnabled(!enabled)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Icon name="notifications_active" className="text-[22px]" />
                            </div>
                            <div>
                                <span className="font-semibold text-gray-900 dark:text-white">每日提醒</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">在设定时间提醒你记录心情</p>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer pointer-events-none">
                            <input
                                className="sr-only peer"
                                type="checkbox"
                                checked={enabled}
                                readOnly
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary transition-colors"></div>
                        </div>
                    </div>
                </section>

                {/* 提醒时间选择 */}
                {enabled && (
                    <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon name="schedule" className="text-[22px]" />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">提醒时间</span>
                            </div>

                            <div className="flex items-center justify-center py-4">
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="text-4xl font-bold text-center bg-transparent border-none text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div className="mt-4 p-3 rounded-xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10">
                                <div className="flex items-start gap-2">
                                    <Icon name="info" className="text-primary dark:text-mood-neutral text-sm mt-0.5" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        建议选择一个你通常有空闲时间的时段，让记录成为习惯。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 预设时间快捷选择 */}
                {enabled && (
                    <section className="animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
                        <h3 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">快捷选择</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: '早晨', time: '08:00', icon: 'wb_sunny' },
                                { label: '中午', time: '12:00', icon: 'wb_twilight' },
                                { label: '晚间', time: '20:00', icon: 'nights_stay' }
                            ].map((preset) => (
                                <button
                                    key={preset.time}
                                    onClick={() => setTime(preset.time)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${time === preset.time
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon name={preset.icon} className={time === preset.time ? 'text-white' : 'text-primary'} />
                                    <span className="text-sm font-medium">{preset.label}</span>
                                    <span className="text-xs opacity-80">{preset.time}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* 保存按钮 */}
            <div className="mt-auto px-4 pb-8">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 h-14 bg-primary dark:bg-gray-100 dark:text-primary text-white rounded-xl shadow-lg shadow-primary/25 dark:shadow-black/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="font-bold text-lg tracking-wide">
                        {saving ? '保存中...' : '保存设置'}
                    </span>
                    {!saving && <Icon name="check" />}
                </button>
            </div>
        </div>
    );
};
