import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

const APP_VERSION = '1.3.2';

const features = [
  { icon: 'edit_note', title: '情绪记录', desc: '随时记下你当下的感受。' },
  { icon: 'calendar_month', title: '历史回顾', desc: '按日期回看自己的记录。' },
  { icon: 'bar_chart', title: '统计分析', desc: '慢慢看见情绪变化的节奏。' },
  { icon: 'download', title: '数据导出', desc: '支持 CSV、JSON 和 TXT 格式。' }
];

const stack = ['React', 'TypeScript', 'Capacitor', 'SQLite', 'TailwindCSS'];

export const AboutInfo: React.FC = () => {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (document.scrollingElement) {
        document.scrollingElement.scrollTop = 0;
      }
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display text-[#121617] antialiased dark:bg-background-dark dark:text-gray-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200/50 bg-background-light/80 p-4 backdrop-blur-md transition-colors duration-300 dark:border-gray-800/50 dark:bg-background-dark/80">
        <button
          onClick={() => navigate('/settings', { replace: true })}
          className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Icon name="arrow_back_ios_new" className="text-[#121617] dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-[#121617] dark:text-white">软件信息</h1>
        <div className="size-10 shrink-0" />
      </header>

      <main ref={mainRef} className="flex flex-col gap-6 px-4 py-6">
        <section className="flex flex-col items-center py-8">
          <div className="mb-4 size-24 overflow-hidden rounded-[28%] bg-white ring-8 ring-gray-50/50 shadow-2xl shadow-primary/20 dark:ring-gray-800/50">
            <img src="icon.png" alt="MoodListener" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">MoodListener</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">听见你的情绪</p>
          <span className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:bg-white/10 dark:text-mood-neutral">
            版本 {APP_VERSION}
          </span>

          <a
            href="https://github.com/qup1010/MoodListener"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center gap-2 rounded-full bg-[#24292e] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-[#24292e]"
          >
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub 项目地址
          </a>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-50 p-4 dark:border-gray-700/50">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">核心功能</h3>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name={feature.icon} className="text-lg" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{feature.title}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">技术栈</h3>
            <div className="flex flex-wrap gap-2">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            className="flex w-full items-center justify-between border-b border-gray-50 p-4 transition-colors active:bg-gray-50 dark:border-gray-700/50 dark:active:bg-gray-700/50"
            onClick={() => setShowPrivacy(true)}
          >
            <div className="flex items-center gap-3">
              <Icon name="privacy_tip" className="text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">隐私政策</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" size={20} />
          </button>
          <button
            className="flex w-full items-center justify-between p-4 transition-colors active:bg-gray-50 dark:active:bg-gray-700/50"
            onClick={() => setShowTerms(true)}
          >
            <div className="flex items-center gap-3">
              <Icon name="description" className="text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">用户协议</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" size={20} />
          </button>
        </section>

        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPrivacy(false)}>
            <div className="max-h-[80vh] w-[90%] max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">隐私政策</h3>
                <button onClick={() => setShowPrivacy(false)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Icon name="close" className="text-gray-500" />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>最后更新：2026 年 3 月</strong></p>
                <p>MoodListener 重视你的隐私。本应用以本地存储为主，记录、设置和个人资料都默认保存在你的设备上。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">数据收集</h4>
                <p>我们不会主动上传、出售或共享你的情绪记录和个人数据。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">数据存储</h4>
                <p>应用主要使用本地存储和 SQLite 在设备内保存数据，不依赖在线账户才能使用。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">权限说明</h4>
                <ul className="list-inside list-disc space-y-1">
                  <li>相机或相册权限：用于设置头像或添加图片。</li>
                  <li>通知权限：用于定时提醒功能。</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTerms(false)}>
            <div className="max-h-[80vh] w-[90%] max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">用户协议</h3>
                <button onClick={() => setShowTerms(false)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Icon name="close" className="text-gray-500" />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>最后更新：2026 年 3 月</strong></p>
                <p>欢迎使用 MoodListener。它是一个帮助你记录、回顾和观察情绪变化的本地工具。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">服务说明</h4>
                <p>本应用用于自我记录与整理，不替代专业心理咨询、医疗建议或紧急支持服务。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">用户责任</h4>
                <p>请自行妥善保管设备和备份文件。若因设备损坏、丢失或误删导致数据丢失，需要依赖你自己的备份恢复。</p>
                <h4 className="font-bold text-gray-900 dark:text-white">免责声明</h4>
                <p>我们会尽力保证体验稳定，但不对所有场景下的数据完整性或适用性作绝对承诺。</p>
              </div>
            </div>
          </div>
        )}

        <div className="py-6 text-center">
          <p className="text-xs font-medium text-gray-400">© 2024-2026 MoodListener</p>
          <p className="mt-1 text-[10px] text-gray-300 dark:text-gray-600">Made with heart for your mental health</p>
        </div>
      </main>
    </div>
  );
};