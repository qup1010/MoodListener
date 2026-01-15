/**
 * 软件信息页面
 * 展示应用版本、开发者信息等
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import logo from '../src/assets/logo.png';

export const AboutInfo: React.FC = () => {
    const navigate = useNavigate();
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
            <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-[#121617] dark:text-white" />
                </button>
                <h1 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">软件信息</h1>
                <div className="size-10 shrink-0"></div>
            </header>

            <main className="px-4 py-6 flex flex-col gap-6">
                {/* 应用 Logo 和名称 */}
                <section className="flex flex-col items-center py-8">
                    <div className="size-24 rounded-[28%] overflow-hidden shadow-2xl shadow-primary/20 mb-4 bg-white ring-8 ring-gray-50/50 dark:ring-gray-800/50">
                        <img src={logo} alt="MoodListener" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">MoodListener</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">听见你的情绪</p>
                    <span className="mt-3 px-3 py-1 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-mood-neutral text-xs font-bold">
                        版本 1.0.0
                    </span>

                    <a
                        href="https://github.com/qup1010/MoodListener"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#24292e] dark:bg-white text-white dark:text-[#24292e] rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm font-bold"
                    >
                        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub 项目地址
                    </a>
                </section>

                {/* 功能介绍 */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-50 dark:border-gray-700/50">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">核心功能</h3>
                        <div className="space-y-3">
                            {[
                                { icon: 'edit_note', title: '情绪记录', desc: '随时记录你的心情状态' },
                                { icon: 'calendar_month', title: '日历视图', desc: '按日期查看历史情绪' },
                                { icon: 'bar_chart', title: '统计分析', desc: '了解你的情绪趋势' },
                                { icon: 'download', title: '数据导出', desc: '支持 CSV/JSON/TXT 格式' }
                            ].map((feature) => (
                                <div key={feature.title} className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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

                {/* 技术信息 */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="p-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">技术栈</h3>
                        <div className="flex flex-wrap gap-2">
                            {['React', 'TypeScript', 'Capacitor', 'SQLite', 'TailwindCSS'].map((tech) => (
                                <span
                                    key={tech}
                                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 法律信息 */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                        className="flex w-full items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                        onClick={() => setShowPrivacy(true)}
                    >
                        <div className="flex items-center gap-3">
                            <Icon name="privacy_tip" className="text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">隐私政策</span>
                        </div>
                        <Icon name="chevron_right" className="text-gray-400" size={20} />
                    </button>
                    <button
                        className="flex w-full items-center justify-between p-4 transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                        onClick={() => setShowTerms(true)}
                    >
                        <div className="flex items-center gap-3">
                            <Icon name="description" className="text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">用户协议</span>
                        </div>
                        <Icon name="chevron_right" className="text-gray-400" size={20} />
                    </button>
                </section>

                {/* 隐私政策 Modal */}
                {showPrivacy && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPrivacy(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-[90%] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">隐私政策</h3>
                                <button onClick={() => setShowPrivacy(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <Icon name="close" className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh] text-sm text-gray-600 dark:text-gray-300 space-y-4">
                                <p><strong>最后更新：2026年1月</strong></p>
                                <p>MoodListener 高度重视您的隐私保护。本应用采用完全离线的设计，所有数据均存储在您的设备本地。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">数据收集</h4>
                                <p>本应用不收集、不上传、不分享您的任何个人数据。您的心情记录、设置和个人信息仅保存在您的设备上。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">数据存储</h4>
                                <p>所有数据使用 SQLite 数据库存储在设备本地，不涉及任何网络传输。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">权限说明</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>相机/相册权限：用于设置个人头像</li>
                                    <li>通知权限：用于每日提醒功能</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 用户协议 Modal */}
                {showTerms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTerms(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-[90%] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">用户协议</h3>
                                <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <Icon name="close" className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh] text-sm text-gray-600 dark:text-gray-300 space-y-4">
                                <p><strong>最后更新：2026年1月</strong></p>
                                <p>欢迎使用 MoodListener！使用本应用即表示您同意以下条款。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">服务说明</h4>
                                <p>MoodListener 是一款帮助您记录和追踪情绪状态的工具应用。本应用不提供专业的心理咨询或医疗建议。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">用户责任</h4>
                                <p>您应妥善保管设备数据。因设备丢失、损坏或卸载应用导致的数据丢失，开发者不承担责任。</p>
                                <h4 className="font-bold text-gray-900 dark:text-white">免责声明</h4>
                                <p>本应用按"现状"提供，开发者不对应用的适用性或准确性作任何保证。</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 版权信息 */}
                <div className="text-center py-6">
                    <p className="text-xs text-gray-400 font-medium">
                        © 2024-2026 MoodListener
                    </p>
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                        Made with ❤️ for your mental health
                    </p>
                </div>
            </main>
        </div>
    );
};
