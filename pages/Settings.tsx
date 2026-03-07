import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { THEMES, toggleDarkMode, applyTheme, DarkModeOption, syncThemeFromSettings } from '../theme';
import {
  exportData,
  exportEncryptedBackupV2,
  fetchSettings,
  importEncryptedBackupV2,
  updateSettings
} from '../services';
import { confirmAction, promptAction, showToast } from '../src/ui/feedback';
import { MOOD_ICON_PACKS, MOOD_LEVELS, MoodIconPackId, resolveMoodIconPackId, storeMoodIconPackId } from '../src/constants/moodV2';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState<DarkModeOption>('system');
  const [currentTheme, setCurrentTheme] = useState('forest');
  const [currentPack, setCurrentPack] = useState<MoodIconPackId>('playful');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDarkModePicker, setShowDarkModePicker] = useState(false);
  const [showPackPicker, setShowPackPicker] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [secureExporting, setSecureExporting] = useState(false);
  const [secureImporting, setSecureImporting] = useState(false);
  const [savingPack, setSavingPack] = useState<string | null>(null);
  const [remindersText, setRemindersText] = useState('\u52a0\u8f7d\u4e2d...');

  useEffect(() => {
    const rawDarkMode = localStorage.getItem('darkMode');
    const savedDarkMode: DarkModeOption = rawDarkMode === 'light' || rawDarkMode === 'dark' || rawDarkMode === 'system' ? rawDarkMode : 'system';
    setDarkMode(savedDarkMode);
    setCurrentTheme(localStorage.getItem('themeId') || 'forest');
    setCurrentPack(resolveMoodIconPackId(localStorage.getItem('mood_icon_pack_id')));
    void loadSettingsStatus();
  }, []);

  const loadSettingsStatus = async () => {
    try {
      const settings = await fetchSettings();
      const nextPack = resolveMoodIconPackId(settings.mood_icon_pack_id);
      setCurrentPack(nextPack);
      storeMoodIconPackId(nextPack);

      if (!settings.notification_enabled) {
        setRemindersText('\u672a\u5f00\u542f');
      } else {
        const count = settings.reminders?.filter((item) => item.enabled).length || 0;
        setRemindersText(count > 0 ? `\u5df2\u5f00\u542f ${count} \u4e2a\u63d0\u9192` : '\u6682\u65e0\u63d0\u9192');
      }
    } catch (error) {
      setRemindersText('\u914d\u7f6e');
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

  const handleIconPackChange = async (packId: MoodIconPackId) => {
    if (packId === currentPack || savingPack) return;
    const previous = currentPack;
    setSavingPack(packId);
    setCurrentPack(packId);
    storeMoodIconPackId(packId);

    try {
      await updateSettings({ mood_icon_pack_id: packId });
    } catch (error) {
      setCurrentPack(previous);
      storeMoodIconPackId(previous);
      showToast('\u5207\u6362\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5', 'error');
    } finally {
      setSavingPack(null);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'txt') => {
    setExporting(format);
    try {
      await exportData(format);
    } catch (error) {
      console.error('\u5bfc\u51fa\u5931\u8d25:', error);
      showToast('\u5bfc\u51fa\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5', 'error');
    } finally {
      setExporting(null);
    }
  };

  const askPassphrase = async (title: string, message: string): Promise<string | null> => {
    const value = await promptAction({
      title,
      message,
      placeholder: '\u8bf7\u8f93\u5165\u5907\u4efd\u53e3\u4ee4\uff08\u81f3\u5c11 4 \u4f4d\uff09',
      confirmText: '\u786e\u8ba4',
      cancelText: '\u53d6\u6d88'
    });

    if (!value) return null;
    const passphrase = value.trim();

    if (passphrase.length < 4) {
      showToast('\u53e3\u4ee4\u81f3\u5c11\u9700\u8981 4 \u4e2a\u5b57\u7b26', 'error');
      return null;
    }

    return passphrase;
  };

  const triggerSecureImport = () => {
    importInputRef.current?.click();
  };

  const handleSecureExport = async () => {
    const passphrase = await askPassphrase('\u52a0\u5bc6\u5907\u4efd', '\u8bf7\u8f93\u5165\u5bfc\u51fa\u53e3\u4ee4\uff0c\u7528\u4e8e\u52a0\u5bc6\u5907\u4efd\u6587\u4ef6');
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
        showToast('\u52a0\u5bc6\u5907\u4efd\u5df2\u5bfc\u51fa', 'success');
      } else {
        showToast(`\u52a0\u5bc6\u5907\u4efd\u5df2\u4fdd\u5b58\uff1a${output}`, 'success', 3200);
      }
    } catch (error: any) {
      console.error('\u52a0\u5bc6\u5bfc\u51fa\u5931\u8d25:', error);
      showToast(error?.message || '\u52a0\u5bc6\u5bfc\u51fa\u5931\u8d25', 'error');
    } finally {
      setSecureExporting(false);
    }
  };

  const handleSecureImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const passphrase = await askPassphrase('\u5bfc\u5165\u5907\u4efd', '\u8bf7\u8f93\u5165\u5bfc\u5165\u53e3\u4ee4\u4ee5\u89e3\u5bc6\u5907\u4efd\u6587\u4ef6');
    if (!passphrase) return;

    const confirmed = await confirmAction({
      title: '\u6062\u590d\u5907\u4efd\u786e\u8ba4',
      message: '\u6062\u590d\u4f1a\u7528\u5907\u4efd\u5185\u5bb9\u66ff\u6362\u5f53\u524d\u8bb0\u5f55\u3001\u6d3b\u52a8\u548c\u8bbe\u7f6e\uff0c\u5f53\u524d\u6570\u636e\u65e0\u6cd5\u64a4\u9500\u3002\u5efa\u8bae\u5148\u5bfc\u51fa\u4e00\u6b21\u52a0\u5bc6\u5907\u4efd\uff0c\u518d\u7ee7\u7eed\u6062\u590d\u3002',
      confirmText: '\u786e\u8ba4\u6062\u590d',
      cancelText: '\u53d6\u6d88',
      danger: true
    });

    if (!confirmed) return;

    setSecureImporting(true);
    try {
      const result = await importEncryptedBackupV2(file, passphrase);
      await syncThemeFromSettings();
      await loadSettingsStatus();
      showToast(`\u6062\u590d\u6210\u529f\uff0c${result.entries} \u6761\u8bb0\u5f55\uff0c${result.groups} \u4e2a\u5206\u7ec4\uff0c${result.activities} \u4e2a\u6d3b\u52a8`, 'success', 3200);
    } catch (error: any) {
      console.error('\u52a0\u5bc6\u5bfc\u5165\u5931\u8d25:', error);
      showToast(error?.message || '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u53e3\u4ee4\u548c\u5907\u4efd\u6587\u4ef6', 'error', 3200);
    } finally {
      setSecureImporting(false);
    }
  };

  const rowClassName = 'flex items-center justify-between gap-3 p-4 text-left transition-colors cursor-pointer active:bg-black/3 dark:active:bg-white/6';
  const iconClassName = 'size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary';
  const activePackMeta = MOOD_ICON_PACKS.find((item) => item.id === currentPack) || MOOD_ICON_PACKS[0];

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-4">
        <div>
          <h1 className="page-title">{'\u8bbe\u7f6e\u4e0e\u7ba1\u7406'}</h1>
          <p className="page-subtitle">{'\u5e38\u7528\u8bbe\u7f6e\u90fd\u653e\u5728\u8fd9\u91cc\uff0c\u6539\u8d77\u6765\u66f4\u987a\u624b\u3002'}</p>
        </div>
      </header>

      <main className="page-content pb-28">
        <input ref={importInputRef} type="file" accept=".mlbk,.json,application/json" className="hidden" onChange={handleSecureImportFileChange} />

        <section>
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u4e2a\u6027\u5316\u8bbe\u7f6e'}</div>
          <div className="ui-card overflow-hidden">
            <div className={`${rowClassName} border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/tags')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="sell" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">{'\u6d3b\u52a8\u7ba1\u7406'}</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u6574\u7406\u5206\u7ec4\u3001\u540d\u79f0\u548c\u987a\u5e8f'}</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </div>

            <div className="border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
              <button className={`${rowClassName} w-full`} onClick={() => setShowPackPicker((prev) => !prev)}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={iconClassName}><Icon name="mood" className="text-[22px]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{'\u81ea\u5b9a\u4e49\u60c5\u7eea\u56fe\u6807'}</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u5207\u6362\u4e00\u6574\u5957\u60c5\u7eea\u8868\u60c5\u98ce\u683c'}</div>
                  </div>
                </div>
                <Icon name={showPackPicker ? 'expand_less' : 'expand_more'} className="shrink-0 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
              </button>

              {showPackPicker && (
                <div className="grid gap-3 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                  {MOOD_ICON_PACKS.map((pack) => {
                    const active = currentPack === pack.id;
                    return (
                      <button
                        key={pack.id}
                        onClick={() => void handleIconPackChange(pack.id)}
                        disabled={savingPack !== null}
                        className={`rounded-[22px] border p-4 text-left transition-all ${active ? 'border-[var(--ui-border-strong-light)] bg-white/78 shadow-sm dark:border-[var(--ui-border-strong-dark)] dark:bg-white/6' : 'border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{pack.name}</div>
                            <div className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{pack.description}</div>
                          </div>
                          {active && <Icon name="check_circle" className="text-primary" size={18} />}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {MOOD_LEVELS.map((mood) => (
                            <div key={`${pack.id}-${mood.score}`} className="flex flex-col items-center gap-1">
                              <MoodFaceIcon mood={mood} size={38} packId={pack.id} />
                              <span className="text-[9px] font-semibold" style={{ color: mood.displayColor }}>{mood.label}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
              <button className={`${rowClassName} w-full`} onClick={() => setShowDarkModePicker((prev) => !prev)}>
                <div className="flex items-center gap-3">
                  <div className={iconClassName}><Icon name="dark_mode" className="text-[22px]" /></div>
                  <div>
                    <div className="font-semibold">{'\u6df1\u8272\u6a21\u5f0f'}</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u5f53\u524d\uff1a'}{darkMode === 'light' ? '\u5173\u95ed' : darkMode === 'dark' ? '\u5f00\u542f' : '\u8ddf\u968f\u7cfb\u7edf'}</div>
                  </div>
                </div>
                <Icon name={showDarkModePicker ? 'expand_less' : 'expand_more'} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
              </button>

              {showDarkModePicker && (
                <div className="flex justify-center gap-3 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: 'light' as DarkModeOption, label: '\u5173\u95ed', icon: 'light_mode' },
                    { id: 'dark' as DarkModeOption, label: '\u5f00\u542f', icon: 'dark_mode' },
                    { id: 'system' as DarkModeOption, label: '\u8ddf\u968f\u7cfb\u7edf', icon: 'smartphone' }
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
                  <div className="font-semibold">{'\u5b9a\u65f6\u63d0\u9192'}</div>
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
                    <div className="font-semibold">{'\u989c\u8272\u4e3b\u9898'}</div>
                    <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u6362\u4e00\u4e2a\u4f60\u66f4\u559c\u6b22\u7684\u9875\u9762\u989c\u8272'}</div>
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
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u6570\u636e\u7ba1\u7406'}</div>
          <div className="flex flex-col gap-3">
            <div className="ui-card ui-card--subtle p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{'\u5907\u4efd\uff08\u5b89\u5168\u3001\u53ef\u6062\u590d\uff09'}</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u52a0\u5bc6\u5907\u4efd\u53ea\u4fdd\u5b58\u5728\u672c\u5730\u6587\u4ef6\uff0c\u6062\u590d\u65f6\u9700\u8981\u53e3\u4ee4\u3002'}</p>
                </div>
                <Icon name="enhanced_encryption" className="text-primary" />
              </div>
              <button className="ui-action-primary" onClick={handleSecureExport} disabled={secureExporting || secureImporting}>
                {secureExporting ? '\u52a0\u5bc6\u5bfc\u51fa\u4e2d...' : '\u52a0\u5bc6\u5907\u4efd\u5bfc\u51fa'}
              </button>
            </div>

            <div className="ui-card p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{'\u5bfc\u51fa\uff08\u5916\u90e8\u4f7f\u7528\uff09'}</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u7528\u4e8e\u8868\u683c\u5206\u6790\u6216\u5176\u4ed6\u5de5\u5177\u67e5\u770b\uff0c\u4e0d\u7528\u4e8e\u5b8c\u6574\u6062\u590d\u3002'}</p>
                </div>
                <Icon name="ios_share" className="text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="ui-action-secondary" onClick={() => handleExport('csv')} disabled={exporting === 'csv'}>{exporting === 'csv' ? '\u5bfc\u51fa\u4e2d' : 'CSV'}</button>
                <button className="ui-action-secondary" onClick={() => handleExport('json')} disabled={exporting === 'json'}>{exporting === 'json' ? '\u5bfc\u51fa\u4e2d' : 'JSON'}</button>
                <button className="ui-action-secondary" onClick={() => handleExport('txt')} disabled={exporting === 'txt'}>{exporting === 'txt' ? '\u5bfc\u51fa\u4e2d' : 'TXT'}</button>
              </div>
            </div>

            <div className="ui-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{'\u4ece\u5907\u4efd\u6062\u590d'}</h3>
                  <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u7528\u4f60\u4fdd\u5b58\u7684\u52a0\u5bc6\u5907\u4efd\uff0c\u628a\u6570\u636e\u6062\u590d\u5230\u5f53\u65f6\u7684\u72b6\u6001\u3002'}</p>
                </div>
                <Icon name="settings_backup_restore" className="text-primary" />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] px-3.5 py-3 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon name="info" size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">{'\u6062\u590d\u524d\u5efa\u8bae\u5148\u5bfc\u51fa\u4e00\u6b21\u5f53\u524d\u5907\u4efd'}</p>
                    <p className="text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u8fd9\u6837\u5373\u4f7f\u6062\u590d\u540e\u60f3\u56de\u5230\u73b0\u5728\uff0c\u4e5f\u8fd8\u6709\u4e00\u4efd\u53ef\u7528\u5907\u4efd\u3002'}</p>
                  </div>
                </div>
              </div>

              <button className="ui-action-secondary mt-4 min-h-[2.9rem] w-full text-sm font-bold" onClick={triggerSecureImport} disabled={secureImporting || secureExporting}>
                <Icon name="upload_file" size={18} />
                {secureImporting ? '\u6062\u590d\u4e2d...' : '\u9009\u62e9\u5907\u4efd\u6587\u4ef6\u6062\u590d'}
              </button>
              <p className="mt-3 text-[11px] leading-5 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u6062\u590d\u65f6\u4f1a\u5728\u4e0b\u4e00\u6b65\u518d\u6b21\u786e\u8ba4\uff0c\u5e76\u8bf4\u660e\u5c06\u66ff\u6362\u5f53\u524d\u8bb0\u5f55\u3001\u6d3b\u52a8\u548c\u8bbe\u7f6e\u3002'}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u5173\u4e8e'}</div>
          <div className="ui-card overflow-hidden">
            <button className={`${rowClassName} w-full border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`} onClick={() => navigate('/settings/about')}>
              <div className="flex items-center gap-3">
                <div className={iconClassName}><Icon name="info" className="text-[22px]" /></div>
                <div>
                  <div className="font-semibold">{'\u8f6f\u4ef6\u4fe1\u606f'}</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u7248\u672c 1.3.1'}</div>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </button>
            <button className={`${rowClassName} w-full`} onClick={() => window.open('https://github.com/qup1010/MoodListener/issues/new', '_blank', 'noopener,noreferrer')}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={iconClassName}><Icon name="bug_report" className="text-[22px]" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{'\u610f\u89c1\u53cd\u9988'}</div>
                  <div className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'\u6709\u60f3\u6cd5\u6216\u9047\u5230\u95ee\u9898\uff0c\u90fd\u53ef\u4ee5\u544a\u8bc9\u6211\u4eec'}</div>
                </div>
              </div>
              <Icon name="open_in_new" className="shrink-0 text-[20px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" />
            </button>
          </div>
        </section>

        <div className="ui-card ui-card--subtle p-4 text-center">
          <p className="text-sm font-bold">MoodListener - {'\u542c\u89c1\u4f60\u7684\u60c5\u7eea'}</p>
          <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">Made with heart for your mental health</p>
          <div className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ui-border-subtle-light)] bg-white/70 px-3 py-2 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5">
            <Icon name="verified_user" className="text-[14px] text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{'\u672c\u5730\u5b58\u50a8\u5df2\u5f00\u542f'}</span>
          </div>
        </div>
      </main>
    </div>
  );
};
