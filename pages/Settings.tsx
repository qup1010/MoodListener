/**
 * 设置页面
 * 个性化设置、数据管理和软件信息
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { THEMES, toggleDarkMode, applyTheme, DarkModeOption, syncThemeFromSettings } from '../theme';
import {
  exportData,
  exportEncryptedBackup,
  fetchSettings,
  importEncryptedBackup
} from '../services';
import { confirmAction, promptAction, showToast } from '../src/ui/feedback';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState<DarkModeOption>('system');
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDarkModePicker, setShowDarkModePicker] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [secureExporting, setSecureExporting] = useState(false);
  const [secureImporting, setSecureImporting] = useState(false);
  const [remindersText, setRemindersText] = useState('加载中...');

  useEffect(() => {
    const rawDarkMode = localStorage.getItem('darkMode');
    const savedDarkMode: DarkModeOption = rawDarkMode === 'light' || rawDarkMode === 'dark' || rawDarkMode === 'system' ? rawDarkMode : 'system';
    setDarkMode(savedDarkMode);

    const savedTheme = localStorage.getItem('themeId') || 'classic';
    setCurrentTheme(savedTheme);

    void loadSettingsStatus();
  }, []);

  const loadSettingsStatus = async () => {
    try {
      const settings = await fetchSettings();
      if (!settings.notification_enabled) {
        setRemindersText('未开启');
      } else {
        const count = settings.reminders?.filter(r => r.enabled).length || 0;
        setRemindersText(count > 0 ? `已开启 ${count} 个提醒` : '暂无提醒');
      }
    } catch (error) {
      setRemindersText('配置');
    }
  };

  const handleDarkModeChange = (option: DarkModeOption) => {
    setDarkMode(option);
    void toggleDarkMode(option);
    setShowDarkModePicker(false);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    void applyTheme(themeId);
  };

  const handleExport = async (format: 'csv' | 'json' | 'txt') => {
    setExporting(format);
    try {
      await exportData(format);
    } catch (error) {
      console.error('导出失败:', error);
      showToast('导出失败，请重试', 'error');
    } finally {
      setExporting(null);
    }
  };

  const askPassphrase = async (title: string, message: string): Promise<string | null> => {
    const value = await promptAction({
      title,
      message,
      placeholder: '请输入备份口令（至少 4 位）',
      confirmText: '确认',
      cancelText: '取消'
    });

    if (!value) return null;
    const passphrase = value.trim();

    if (passphrase.length < 4) {
      showToast('口令至少需要 4 个字符', 'error');
      return null;
    }

    return passphrase;
  };

  const triggerSecureImport = () => {
    importInputRef.current?.click();
  };

  const handleSecureExport = async () => {
    const passphrase = await askPassphrase('加密备份', '请输入导出口令，用于加密备份文件');
    if (!passphrase) return;

    setSecureExporting(true);

    try {
      const output = await exportEncryptedBackup(passphrase);

      if (output instanceof File) {
        const url = URL.createObjectURL(output);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = output.name;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast('加密备份已导出', 'success');
      } else {
        showToast(`加密备份已保存: ${output}`, 'success', 3200);
      }
    } catch (error: any) {
      console.error('加密导出失败:', error);
      showToast(error?.message || '加密导出失败', 'error');
    } finally {
      setSecureExporting(false);
    }
  };

  const handleSecureImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const passphrase = await askPassphrase('导入备份', '请输入导入口令以解密备份文件');
    if (!passphrase) return;

    const confirmed = await confirmAction({
      title: '全量恢复确认',
      message: '导入将覆盖当前所有记录、标签与设置，且不可撤销。建议先执行一次加密备份。是否继续？',
      confirmText: '继续恢复',
      cancelText: '取消',
      danger: true
    });

    if (!confirmed) return;

    setSecureImporting(true);

    try {
      const result = await importEncryptedBackup(file, passphrase);
      await syncThemeFromSettings();
      await loadSettingsStatus();
      showToast(`恢复成功：${result.entries} 条记录，${result.tags} 个标签`, 'success', 3200);
    } catch (error: any) {
      console.error('加密导入失败:', error);
      showToast(error?.message || '导入失败，请检查口令和备份文件', 'error', 3200);
    } finally {
      setSecureImporting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
      <header className="flex items-center justify-center p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
        <h1 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-tight">设置与管理</h1>
      </header>

      <main className="px-4 py-6 flex flex-col gap-8 pb-28">
        <input
          ref={importInputRef}
          type="file"
          accept=".mlbk,.json,application/json"
          className="hidden"
          onChange={handleSecureImportFileChange}
        />

        <section>
          <h2 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">个性化设置</h2>
          <div className="ui-card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="person" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">个人资料</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">设置名称</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/tags')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="sell" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">标签管理</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">自定义标签</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            <div className="flex flex-col transition-colors border-b border-gray-100 dark:border-gray-700/50">
              <button
                className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                onClick={() => setShowDarkModePicker(!showDarkModePicker)}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name="dark_mode" className="text-[22px]" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">深色模式</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    {darkMode === 'light' ? '关闭' : darkMode === 'dark' ? '开启' : '跟随系统'}
                  </span>
                  <Icon name={showDarkModePicker ? 'expand_less' : 'expand_more'} className="text-gray-400" size={20} />
                </div>
              </button>

              {showDarkModePicker && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 flex gap-3 justify-center">
                  {[
                    { id: 'light' as DarkModeOption, label: '关闭', icon: 'light_mode' },
                    { id: 'dark' as DarkModeOption, label: '开启', icon: 'dark_mode' },
                    { id: 'system' as DarkModeOption, label: '跟随系统', icon: 'smartphone' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleDarkModeChange(option.id)}
                      className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${darkMode === option.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                      <Icon name={option.icon} size={24} />
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/notifications')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="notifications_active" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">定时提醒</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">{remindersText}</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            <div className="flex flex-col transition-colors">
              <button
                className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                onClick={() => setShowThemePicker(!showThemePicker)}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name="palette" className="text-[22px]" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">颜色主题</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div
                    className="size-5 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: THEMES.find(t => t.id === currentTheme)?.hex }}
                  ></div>
                  <Icon name={showThemePicker ? 'expand_less' : 'chevron_right'} size={20} />
                </div>
              </button>

              {showThemePicker && (
                <div className="px-4 pb-6 pt-2 bg-gray-50/50 dark:bg-black/10 border-t border-gray-100 dark:border-gray-700/50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">选择应用主题色</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className="group relative flex flex-col items-center gap-1"
                      >
                        <div
                          className={`size-10 rounded-full border-2 transition-all duration-200 shadow-sm group-hover:scale-110 ${currentTheme === t.id ? 'border-gray-400 dark:border-white scale-110 ring-2 ring-primary/20' : 'border-white dark:border-gray-600'}`}
                          style={{ backgroundColor: t.hex }}
                        >
                          {currentTheme === t.id && (
                            <div className="flex w-full h-full items-center justify-center">
                              <Icon name="check" className="text-white drop-shadow-md font-bold" size={20} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${currentTheme === t.id ? 'text-primary' : 'text-gray-400'}`}>
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">数据管理</h2>
          <div className="flex flex-col gap-3">
            <div className="ui-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">备份（安全、可恢复）</h3>
                  <p className="text-xs text-gray-500 mt-1">加密备份仅保存在本地文件中，恢复时需要口令。</p>
                </div>
                <Icon name="enhanced_encryption" className="text-primary" />
              </div>
              <button
                className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                onClick={handleSecureExport}
                disabled={secureExporting || secureImporting}
              >
                {secureExporting ? '加密导出中...' : '加密备份导出'}
              </button>
            </div>

            <div className="ui-card p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">导出（外部使用）</h3>
              <p className="text-xs text-gray-500 mb-3">用于表格分析或其他工具查看，不用于完整恢复。</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold disabled:opacity-50" onClick={() => handleExport('csv')} disabled={exporting === 'csv'}>
                  {exporting === 'csv' ? '导出中' : 'CSV'}
                </button>
                <button className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold disabled:opacity-50" onClick={() => handleExport('json')} disabled={exporting === 'json'}>
                  {exporting === 'json' ? '导出中' : 'JSON'}
                </button>
                <button className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold disabled:opacity-50" onClick={() => handleExport('txt')} disabled={exporting === 'txt'}>
                  {exporting === 'txt' ? '导出中' : 'TXT'}
                </button>
              </div>
            </div>

            <div className="ui-card p-4 border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">导入/恢复（高风险）</h3>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1">会覆盖现有记录、标签和设置，不可撤销。</p>
                </div>
                <Icon name="warning" className="text-rose-600 dark:text-rose-300" />
              </div>
              <button
                className="w-full h-11 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50"
                onClick={triggerSecureImport}
                disabled={secureImporting || secureExporting}
              >
                {secureImporting ? '恢复中...' : '导入加密备份（全量覆盖）'}
              </button>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-2">建议先执行一次“加密备份导出”再进行恢复。</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">关于</h2>
          <div className="ui-card overflow-hidden">
            <button
              className="flex w-full items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/about')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors">
                  <Icon name="info" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">软件信息</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">版本 1.2.0</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </button>
            <button
              className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => window.open('https://github.com/qup1010/MoodListener/issues/new', '_blank', 'noopener,noreferrer')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors">
                  <Icon name="bug_report" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">反馈问题</span>
              </div>
              <Icon name="open_in_new" className="text-gray-400 text-[20px]" />
            </button>
          </div>
        </section>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-400 font-medium">MoodListener - 听见你的情绪</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 uppercase tracking-tighter">Made with heart for your mental health</p>
        </div>
      </main>

      <div className="mt-auto px-4 pb-8">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10">
          <Icon name="verified_user" className="text-primary text-[14px]" />
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">本地存储 已开启</span>
        </div>
      </div>
    </div>
  );
};
