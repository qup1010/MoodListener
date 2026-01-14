/**
 * 设置页面
 * 个性化设置、数据管理和软件信息
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { THEMES, toggleDarkMode, applyTheme, DarkModeOption } from '../theme';
import { exportData } from '../services';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<DarkModeOption>('light');
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDarkModePicker, setShowDarkModePicker] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    // 同步状态与 localStorage
    const savedDarkMode = (localStorage.getItem('darkMode') || 'light') as DarkModeOption;
    setDarkMode(savedDarkMode);

    const savedTheme = localStorage.getItem('themeId') || 'classic';
    setCurrentTheme(savedTheme);
  }, []);

  const handleDarkModeChange = (option: DarkModeOption) => {
    setDarkMode(option);
    toggleDarkMode(option);
    setShowDarkModePicker(false);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  const handleExport = async (format: 'csv' | 'json' | 'txt') => {
    setExporting(format);
    try {
      await exportData(format);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
      <header className="flex items-center justify-center p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
        <h1 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-tight">设置与管理</h1>
      </header>
      <main className="px-4 py-6 flex flex-col gap-8 pb-28">
        <section>
          <h2 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">个性化设置</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            {/* 个人资料 */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                  <Icon name="person" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">个人资料</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">设置名称</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            {/* 标签管理 */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/tags')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 transition-colors">
                  <Icon name="sell" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">标签管理</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">自定义标签</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            {/* 深色模式选择 */}
            <div className="flex flex-col transition-colors">
              <button
                className="flex w-full items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                onClick={() => setShowDarkModePicker(!showDarkModePicker)}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors">
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

            {/* 定时提醒 - 跳转到设置页 */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/notifications')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 transition-colors">
                  <Icon name="notifications_active" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">定时提醒</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">每日 20:00</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </div>

            {/* 颜色主题选择 */}
            <div className="flex flex-col transition-colors">
              <button
                className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                onClick={() => setShowThemePicker(!showThemePicker)}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 transition-colors">
                    <Icon name="palette" className="text-[22px]" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">颜色主题</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div
                    className="size-5 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: THEMES.find(t => t.id === currentTheme)?.hex }}
                  ></div>
                  <Icon name={showThemePicker ? "expand_less" : "chevron_right"} size={20} />
                </div>
              </button>

              {/* 可展开的颜色选择器 */}
              {showThemePicker && (
                <div className="px-4 pb-6 pt-2 bg-gray-50/50 dark:bg-black/10 border-t border-gray-100 dark:border-gray-700/50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">选择应用主题色</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`group relative flex flex-col items-center gap-1`}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <button
              className="flex w-full items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50 disabled:opacity-50"
              onClick={() => handleExport('csv')}
              disabled={exporting === 'csv'}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 transition-colors">
                  <Icon name="csv" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {exporting === 'csv' ? '导出中...' : '导出为 CSV'}
                </span>
              </div>
              <Icon name="download" className="text-gray-400 text-[20px]" />
            </button>
            <button
              className="flex w-full items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50 disabled:opacity-50"
              onClick={() => handleExport('json')}
              disabled={exporting === 'json'}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                  <Icon name="data_object" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {exporting === 'json' ? '导出中...' : '备份为 JSON'}
                </span>
              </div>
              <Icon name="backup" className="text-gray-400 text-[20px]" />
            </button>
            <button
              className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50 disabled:opacity-50"
              onClick={() => handleExport('txt')}
              disabled={exporting === 'txt'}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors">
                  <Icon name="description" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {exporting === 'txt' ? '导出中...' : '导出日记 (TXT)'}
                </span>
              </div>
              <Icon name="share" className="text-gray-400 text-[20px]" />
            </button>
          </div>
        </section>
        <section>
          <h2 className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">关于</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <button
              className="flex w-full items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
              onClick={() => navigate('/settings/about')}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-mood-neutral transition-colors">
                  <Icon name="info" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">软件信息</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm font-medium">版本 1.0.0</span>
                <Icon name="chevron_right" size={20} />
              </div>
            </button>
            <button className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 transition-colors">
                  <Icon name="favorite" className="text-[22px]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">五星好评</span>
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
          <Icon name="verified_user" className="text-primary dark:text-mood-neutral text-[14px]" />
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">本地加密存储 已开启</span>
        </div>
      </div>
    </div>
  );
};