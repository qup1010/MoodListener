import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { THEMES, toggleDarkMode, applyTheme, DarkModeOption, syncThemeFromSettings } from '../theme';
import {
  exportData,
  exportEncryptedBackupV2,
  fetchSettings,
  importEncryptedBackupV2,
  updateSettings
} from '../services';
import { confirmAction, promptAction, showToast } from '../src/ui/feedback';
import { APP_LOCK_MAX_LENGTH, APP_LOCK_MIN_LENGTH, hashAppLockPassword, isValidAppLockPassword, normalizeAppLockPassword } from '../src/utils/appLock';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const emitAppLockChanged = () => {
    window.dispatchEvent(new Event('moodlistener:app-lock-changed'));
  };
  const importInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState<DarkModeOption>('system');
  const [currentTheme, setCurrentTheme] = useState('forest');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDarkModePicker, setShowDarkModePicker] = useState(false);
  const [showAppLockPanel, setShowAppLockPanel] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [secureExporting, setSecureExporting] = useState(false);
  const [secureImporting, setSecureImporting] = useState(false);
  const [appLockSaving, setAppLockSaving] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockHash, setAppLockHash] = useState<string | null>(null);
  const [remindersText, setRemindersText] = useState('加载中...');

  useEffect(() => {
    const rawDarkMode = localStorage.getItem('darkMode');
    const savedDarkMode: DarkModeOption = rawDarkMode === 'light' || rawDarkMode === 'dark' || rawDarkMode === 'system' ? rawDarkMode : 'system';
    setDarkMode(savedDarkMode);
    setCurrentTheme(localStorage.getItem('themeId') || 'forest');
    void loadSettingsStatus();
  }, []);

  const loadSettingsStatus = async () => {
    try {
      const settings = await fetchSettings();
      setAppLockEnabled(!!settings.app_lock_enabled && !!settings.app_lock_password_hash);
      setAppLockHash(settings.app_lock_password_hash || null);

      if (!settings.notification_enabled) {
        setRemindersText('未开启');
      } else {
        const count = settings.reminders?.filter((item) => item.enabled).length || 0;
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

  const validateAppLockPassword = (value: string) => {
    const normalized = normalizeAppLockPassword(value);
    if (!isValidAppLockPassword(normalized)) {
      showToast(`应用密码需要 ${APP_LOCK_MIN_LENGTH}-${APP_LOCK_MAX_LENGTH} 位`, 'error');
      return null;
    }
    return normalized;
  };

  const askPasswordValue = async (title: string, message: string) => {
    const value = await promptAction({
      title,
      message,
      placeholder: `请输入 ${APP_LOCK_MIN_LENGTH}-${APP_LOCK_MAX_LENGTH} 位密码`,
      confirmText: '确认',
      cancelText: '取消',
      inputType: 'password'
    });

    if (!value) return null;
    return normalizeAppLockPassword(value);
  };

  const handleEnableAppLock = async () => {
    if (appLockSaving) return;
    const first = await askPasswordValue('设置应用密码', '开启后，每次进入应用都需要先输入密码。');
    if (!first) return;
    const password = validateAppLockPassword(first);
    if (!password) return;

    const second = await askPasswordValue('确认应用密码', '请再次输入同一密码。');
    if (!second) return;
    if (password !== second) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }

    setAppLockSaving(true);
    try {
      const nextHash = await hashAppLockPassword(password);
      await updateSettings({ app_lock_enabled: true, app_lock_password_hash: nextHash });
      setAppLockEnabled(true);
      setAppLockHash(nextHash);
      showToast('应用锁已开启', 'success');
    } catch (error) {
      showToast('开启失败，请重试', 'error');
    } finally {
      setAppLockSaving(false);
    }
  };

  const handleChangeAppLockPassword = async () => {
    if (!appLockHash || appLockSaving) return;

    const current = await askPasswordValue('验证当前密码', '修改前请先输入当前应用密码。');
    if (!current) return;
    const currentHash = await hashAppLockPassword(current);
    if (currentHash !== appLockHash) {
      showToast('当前密码不正确', 'error');
      return;
    }

    const next = await askPasswordValue('设置新密码', '请输入新的应用密码。');
    if (!next) return;
    const nextPassword = validateAppLockPassword(next);
    if (!nextPassword) return;

    const confirmNext = await askPasswordValue('确认新密码', '请再次输入新的密码。');
    if (!confirmNext) return;
    if (nextPassword !== confirmNext) {
      showToast('两次输入的新密码不一致', 'error');
      return;
    }

    setAppLockSaving(true);
    try {
      const nextHash = await hashAppLockPassword(nextPassword);
      await updateSettings({ app_lock_enabled: true, app_lock_password_hash: nextHash });
      setAppLockEnabled(true);
      setAppLockHash(nextHash);
      showToast('应用密码已更新', 'success');
    } catch (error) {
      showToast('修改失败，请重试', 'error');
    } finally {
      setAppLockSaving(false);
    }
  };

  const handleDisableAppLock = async () => {
    if (!appLockHash || appLockSaving) return;

    const current = await askPasswordValue('关闭应用锁', '请输入当前密码以确认关闭。');
    if (!current) return;
    const currentHash = await hashAppLockPassword(current);
    if (currentHash !== appLockHash) {
      showToast('当前密码不正确', 'error');
      return;
    }

    const confirmed = await confirmAction({
      title: '关闭应用锁？',
      message: '关闭后，进入应用将不再需要输入密码。',
      confirmText: '关闭',
      cancelText: '取消',
      confirmTone: 'primary'
    });
    if (!confirmed) return;

    setAppLockSaving(true);
    try {
      await updateSettings({ app_lock_enabled: false, app_lock_password_hash: null });
      setAppLockEnabled(false);
      setAppLockHash(null);
      showToast('应用锁已关闭', 'success');
    } catch (error) {
      showToast('关闭失败，请重试', 'error');
    } finally {
      setAppLockSaving(false);
    }
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
      cancelText: '取消',
      inputType: 'password'
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
    const passphrase = await askPassphrase('加密备份', '请输入导出口令，用于加密备份文件。');
    if (!passphrase) return;

    setSecureExporting(true);
    try {
      const output = await exportEncryptedBackupV2(passphrase);

      if (output instanceof File) {
        const url = URL.createObjectURL(output);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = output.name;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast('加密备份已导出', 'success');
      } else {
        showToast(`加密备份已保存：${output}`, 'success', 3200);
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

    const passphrase = await askPassphrase('导入备份', '请输入导入口令以解密备份文件。');
    if (!passphrase) return;

    const confirmed = await confirmAction({
      title: '恢复备份确认',
      message: '恢复会用备份内容替换当前记录、活动和设置，当前数据无法撤销。建议先导出一次加密备份。',
      confirmText: '确认恢复',
      cancelText: '取消',
      danger: true
    });

    if (!confirmed) return;

    setSecureImporting(true);
    try {
      const result = await importEncryptedBackupV2(file, passphrase);
      await syncThemeFromSettings();
      await loadSettingsStatus();
      showToast(`恢复成功：${result.entries} 条记录，${result.groups} 个分组，${result.activities} 个活动`, 'success', 3200);
    } catch (error: any) {
      console.error('加密导入失败:', error);
      showToast(error?.message || '导入失败，请检查口令和备份文件', 'error', 3200);
    } finally {
      setSecureImporting(false);
    }
  };

  const rowClassName = 'flex items-center justify-between gap-3 p-4 text-left transition-colors cursor-pointer active:bg-black/3 dark:active:bg-white/6';
  const iconClassName = 'flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary';

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div>
          <p className="page-subtitle">常用设置都放在这里，改起来更顺手。</p>
        </div>
      </header>

      <main className="page-content pb-28">
        <input ref={importInputRef} type="file" accept=".mlbk,.json,application/json" className="hidden" onChange={handleSecureImportFileChange} />

        <section>
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">个性化设置</div>
          <div className="ui-card overflow-hidden">
            <div className={`${rowClassName} border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/tags')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="sell" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">活动管理</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">整理分组、名称和顺序</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </div>

            <div className={`${rowClassName} border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/icons')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="mood" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">自定义情绪图标</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">切换整套情绪表情风格</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </div>

            <div className="border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
              <button className={`${rowClassName} w-full`} onClick={() => setShowAppLockPanel((prev) => !prev)}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={iconClassName}><Icon name="lock" className="text-[22px]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">应用锁</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                      {appLockEnabled ? '已开启，进入前需要验证密码' : '给应用加一层进入密码'}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-xs font-semibold ${appLockEnabled ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}>
                    {appLockEnabled ? '已开启' : '未开启'}
                  </span>
                  <Icon name={showAppLockPanel ? 'expand_less' : 'expand_more'} size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
                </div>
              </button>

              {showAppLockPanel && (
                <div className="grid gap-3 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                  {!appLockEnabled ? (
                    <button className="ui-action-primary" onClick={() => void handleEnableAppLock()} disabled={appLockSaving}>
                      {appLockSaving ? '保存中...' : '设置密码并开启'}
                    </button>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] px-3.5 py-3 text-xs leading-5 text-[var(--ui-text-secondary-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)] dark:text-[var(--ui-text-secondary-dark)]">
                        应用每次进入或回到前台时，都需要先输入密码才能继续使用。
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="ui-action-secondary" onClick={() => void handleChangeAppLockPassword()} disabled={appLockSaving}>
                          {appLockSaving ? '处理中' : '修改密码'}
                        </button>
                        <button className="ui-action-secondary" onClick={() => void handleDisableAppLock()} disabled={appLockSaving}>
                          {appLockSaving ? '处理中' : '关闭应用锁'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
              <button className={`${rowClassName} w-full`} onClick={() => setShowDarkModePicker((prev) => !prev)}>
                <div className="flex items-center gap-3">
                  <div className={iconClassName}><Icon name="dark_mode" className="text-[22px]" /></div>
                  <div>
                    <div className="font-semibold">深色模式</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                      当前：{darkMode === 'light' ? '关闭' : darkMode === 'dark' ? '开启' : '跟随系统'}
                    </div>
                  </div>
                </div>
                <Icon name={showDarkModePicker ? 'expand_less' : 'expand_more'} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
              </button>

              {showDarkModePicker && (
                <div className="flex justify-center gap-3 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: 'light' as DarkModeOption, label: '关闭', icon: 'light_mode' },
                    { id: 'dark' as DarkModeOption, label: '开启', icon: 'dark_mode' },
                    { id: 'system' as DarkModeOption, label: '跟随系统', icon: 'smartphone' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleDarkModeChange(option.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-3 ${darkMode === option.id ? 'border-primary bg-primary text-white shadow-sm' : 'border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]'}`}
                    >
                      <Icon name={option.icon} size={22} />
                      <span className="text-xs font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${rowClassName} border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/notifications')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="notifications_active" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">定时提醒</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{remindersText}</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </div>

            <div>
              <button className={`${rowClassName} w-full`} onClick={() => setShowThemePicker((prev) => !prev)}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={iconClassName}><Icon name="palette" className="text-[22px]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">颜色主题</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">换一个你更喜欢的页面颜色</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="size-4 rounded-full border border-[var(--ui-border-subtle-light)] shadow-sm dark:border-[var(--ui-border-subtle-dark)]" style={{ backgroundColor: THEMES.find((item) => item.id === currentTheme)?.hex }} />
                  <Icon name={showThemePicker ? 'expand_less' : 'expand_more'} size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
                </div>
              </button>

              {showThemePicker && (
                <div className="flex flex-wrap justify-center gap-4 px-4 pb-5 pt-1 animate-in fade-in slide-in-from-top-2">
                  {THEMES.map((theme) => (
                    <button key={theme.id} onClick={() => handleThemeChange(theme.id)} className="group relative flex flex-col items-center gap-1">
                      <div
                        className={`size-10 rounded-full border-2 transition-all ${currentTheme === theme.id ? 'scale-110 border-[var(--ui-brand-primary)] ring-4 ring-[var(--ui-focus-ring)]' : 'border-white group-hover:scale-105 dark:border-[var(--ui-border-subtle-dark)]'}`}
                        style={{ backgroundColor: theme.hex }}
                      >
                        {currentTheme === theme.id && (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon name="check" className="text-white" size={18} />
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold ${currentTheme === theme.id ? 'text-primary' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}>{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">数据管理</div>
          <div className="flex flex-col gap-3">
            <div className="ui-card ui-card--subtle p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">备份（安全、可恢复）</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">加密备份只保存在本地文件，恢复时需要口令。</p>
                </div>
                <Icon name="enhanced_encryption" className="text-primary" />
              </div>
              <button className="ui-action-primary" onClick={handleSecureExport} disabled={secureExporting || secureImporting}>
                {secureExporting ? '加密导出中...' : '加密备份导出'}
              </button>
            </div>

            <div className="ui-card p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">导出（外部使用）</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">用于表格分析或其它工具查看，不用于完整恢复。</p>
                </div>
                <Icon name="ios_share" className="text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="ui-action-secondary" onClick={() => handleExport('csv')} disabled={exporting === 'csv'}>{exporting === 'csv' ? '导出中' : 'CSV'}</button>
                <button className="ui-action-secondary" onClick={() => handleExport('json')} disabled={exporting === 'json'}>{exporting === 'json' ? '导出中' : 'JSON'}</button>
                <button className="ui-action-secondary" onClick={() => handleExport('txt')} disabled={exporting === 'txt'}>{exporting === 'txt' ? '导出中' : 'TXT'}</button>
              </div>
            </div>

            <div className="ui-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">从备份恢复</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">用你保存的加密备份，把数据恢复到当时的状态。</p>
                </div>
                <Icon name="settings_backup_restore" className="text-primary" />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] px-3.5 py-3 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon name="info" size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">恢复前建议先导出一次当前备份</p>
                    <p className="text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">这样即使恢复后想回到现在，也还有一份可用备份。</p>
                  </div>
                </div>
              </div>

              <button className="ui-action-secondary mt-4 min-h-[2.9rem] w-full text-sm font-bold" onClick={triggerSecureImport} disabled={secureImporting || secureExporting}>
                <Icon name="upload_file" size={18} />
                {secureImporting ? '恢复中...' : '选择备份文件恢复'}
              </button>
              <p className="mt-3 text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">恢复时会在下一步再次确认，并说明将替换当前记录、活动和设置。</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">关于</div>
          <div className="ui-card overflow-hidden">
            <button className={`${rowClassName} w-full border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/about')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="info" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">软件信息</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">版本 1.3.2</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </button>
            <button className={`${rowClassName} w-full`} onClick={() => window.open('https://github.com/qup1010/MoodListener/issues/new', '_blank', 'noopener,noreferrer')}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={iconClassName}><Icon name="bug_report" className="text-[22px]" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">意见反馈</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">有想法或遇到问题，都可以告诉我们</div>
                </div>
              </div>
              <Icon name="open_in_new" className="shrink-0 text-[20px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </button>
          </div>
        </section>

        <div className="ui-card ui-card--subtle p-4 text-center">
          <p className="text-sm font-bold">MoodListener - 听见你的情绪</p>
          <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">Made with heart for your mental health</p>
          <div className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ui-border-subtle-light)] bg-white/70 px-3 py-2 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5">
            <Icon name="verified_user" className="text-[14px] text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">本地存储已开启</span>
          </div>
        </div>
      </main>
    </div>
  );
};
