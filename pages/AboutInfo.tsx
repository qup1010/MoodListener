import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

const APP_VERSION = '1.3.3';

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

  const rowClassName = 'flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-black/3 dark:active:bg-white/6';
  const iconClassName = 'flex size-9 items-center justify-center rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] text-[var(--ui-brand-primary-strong)] shadow-[2px_2px_0_rgba(44,44,44,0.1)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)] dark:text-[var(--ui-brand-primary)]';

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings', { replace: true })}
            className="sketch-icon-button flex size-10 shrink-0 items-center justify-center"
          >
            <Icon name="arrow_back_ios_new" size={18} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">软件信息</h1>
            <p className="mt-0.5 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">应用版本、说明和相关链接都在这里。</p>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="page-content flex-1 overflow-y-auto pb-10">
        <section className="ui-card ui-card--hero p-5 text-center">
          <div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-[22px] border-2 border-dashed border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] p-3 shadow-[3px_3px_0_rgba(44,44,44,0.12)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)]">
            <img src="icon.png" alt="MoodListener" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold">MoodListener</h2>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">听见你的情绪</p>
          <div className="mt-3 flex justify-center">
            <span className="sketch-chip sketch-chip--active">版本 {APP_VERSION}</span>
          </div>

          <div className="mt-5 flex justify-center">
            <a
              href="https://github.com/qup1010/MoodListener"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-action-secondary !w-auto px-4"
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub 项目地址
            </a>
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <div className="border-b border-[var(--ui-border-subtle-light)] p-4 dark:border-[var(--ui-border-subtle-dark)]">
            <h3 className="mb-3 text-sm font-bold">核心功能</h3>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-center gap-3">
                  <div className={iconClassName}>
                    <Icon name={feature.icon} className="text-lg" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{feature.title}</span>
                    <p className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-card p-4">
          <h3 className="mb-3 text-sm font-bold">技术栈</h3>
          <div className="flex flex-wrap gap-2">
            {stack.map((tech) => (
              <span key={tech} className="sketch-chip">{tech}</span>
            ))}
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <button
            className={`${rowClassName} border-b border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]`}
            onClick={() => setShowPrivacy(true)}
          >
            <div className="flex items-center gap-3">
              <div className={iconClassName}>
                <Icon name="privacy_tip" size={18} />
              </div>
              <span className="font-semibold">隐私政策</span>
            </div>
            <Icon name="chevron_right" className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
          </button>
          <button
            className={rowClassName}
            onClick={() => setShowTerms(true)}
          >
            <div className="flex items-center gap-3">
              <div className={iconClassName}>
                <Icon name="description" size={18} />
              </div>
              <span className="font-semibold">用户协议</span>
            </div>
            <Icon name="chevron_right" className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
          </button>
        </section>

        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={() => setShowPrivacy(false)}>
            <div className="w-full max-w-lg rounded-[14px] border-2 border-dashed border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] shadow-[5px_5px_0_rgba(44,44,44,0.15)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[var(--ui-border-subtle-light)] p-4 dark:border-[var(--ui-border-subtle-dark)]">
                <h3 className="text-lg font-bold">隐私政策</h3>
                <button onClick={() => setShowPrivacy(false)} className="sketch-icon-button flex size-9 items-center justify-center">
                  <Icon name="close" className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={18} />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-sm leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                <p><strong>最后更新：2026 年 3 月</strong></p>
                <p>MoodListener 重视你的隐私。本应用以本地存储为主，记录、设置和个人资料都默认保存在你的设备上。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">数据收集</h4>
                <p>我们不会主动上传、出售或共享你的情绪记录和个人数据。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">数据存储</h4>
                <p>应用主要使用本地存储和 SQLite 在设备内保存数据，不依赖在线账户才能使用。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">权限说明</h4>
                <ul className="list-inside list-disc space-y-1">
                  <li>相机或相册权限：用于设置头像或添加图片。</li>
                  <li>通知权限：用于定时提醒功能。</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={() => setShowTerms(false)}>
            <div className="w-full max-w-lg rounded-[14px] border-2 border-dashed border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] shadow-[5px_5px_0_rgba(44,44,44,0.15)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[var(--ui-border-subtle-light)] p-4 dark:border-[var(--ui-border-subtle-dark)]">
                <h3 className="text-lg font-bold">用户协议</h3>
                <button onClick={() => setShowTerms(false)} className="sketch-icon-button flex size-9 items-center justify-center">
                  <Icon name="close" className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={18} />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-sm leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                <p><strong>最后更新：2026 年 3 月</strong></p>
                <p>欢迎使用 MoodListener。它是一个帮助你记录、回顾和观察情绪变化的本地工具。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">服务说明</h4>
                <p>本应用用于自我记录与整理，不替代专业心理咨询、医疗建议或紧急支持服务。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">用户责任</h4>
                <p>请自行妥善保管设备和备份文件。若因设备损坏、丢失或误删导致数据丢失，需要依赖你自己的备份恢复。</p>
                <h4 className="font-bold text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">免责声明</h4>
                <p>我们会尽力保证体验稳定，但不对所有场景下的数据完整性或适用性作绝对承诺。</p>
              </div>
            </div>
          </div>
        )}

        <div className="ui-card ui-card--subtle p-4 text-center">
          <p className="text-sm font-bold">© 2024-2026 MoodListener</p>
          <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">Made with heart for your mental health</p>
        </div>
      </main>
    </div>
  );
};
