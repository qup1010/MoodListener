/**
 * 首页
 * 展示用户问候、快捷入口和统计概览
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchStats, fetchProfile, UserProfile } from '../services';
import { getInitialAvatarDataUrl } from '../src/utils/avatar';

const QUOTES = [
  { text: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '你若盛开，蝴蝶自来；你若精彩，天自安排。', author: '佚名' },
  { text: '不要因为走得太远，而忘记为什么出发。', author: '纪伯伦' },
  { text: '生命中最困难的时刻，往往是最接近转机的时刻。', author: '佚名' },
  { text: '做你自己，因为别人都有人做了。', author: '奥斯卡·王尔德' },
  { text: '今天的努力是为了将来更好的自己。', author: '佚名' },
  { text: '每一天都是一个新的开始，不要让昨天的阴影遮住今天的阳光。', author: '佚名' },
  { text: '心若向阳，无畏悲伤。', author: '佚名' },
  { text: '不管前方的路有多苦，只要走的方向正确，一切都会变得柔和。', author: '宫崎骏' }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [streakDays, setStreakDays] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    loadData();
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const loadData = async () => {
    try {
      const [stats, userProfile] = await Promise.all([fetchStats(), fetchProfile()]);
      setStreakDays(stats.streak_days);
      setTotalEntries(stats.total_entries);
      setProfile(userProfile);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早安';
    if (hour < 14) return '午安';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const currentMonth = `${new Date().getMonth() + 1}月`;
  const username = profile?.username || '朋友';
  const savedAvatar = profile?.avatar_url;
  const avatarUrl =
    savedAvatar && (savedAvatar.startsWith('http') || savedAvatar.startsWith('data:'))
      ? savedAvatar
      : getInitialAvatarDataUrl(username, '#355c5f');

  const progressText = useMemo(() => {
    if (totalEntries === 0) return '先记录第一条，开始你的情绪档案。';
    if (streakDays >= 7) return `你已连续记录 ${streakDays} 天，节奏非常稳定。`;
    return `本月已记录 ${totalEntries} 条，继续保持。`;
  }, [streakDays, totalEntries]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="px-6 pt-10 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-primary dark:text-primary mb-1">{getGreeting()}，{username}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{progressText}</p>
          </div>
          <button
            className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/settings/profile')}
            aria-label="个人资料"
          >
            <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-5 overflow-y-auto pb-6">
        <section className="bg-primary dark:bg-card-dark rounded-3xl p-6 shadow-glow">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-3">核心入口</span>
              <h2 className="text-2xl font-bold text-white mb-2">记录当下心情</h2>
              <p className="text-white/80 text-sm mb-4">描述、标签、位置与图片，都可以在一条记录里完成。</p>
            </div>
            <Icon name="mood" size={54} className="text-white/35" />
          </div>
          <button
            onClick={() => navigate('/record')}
            className="flex items-center gap-2 text-white font-bold text-sm bg-white/20 px-4 py-2.5 rounded-xl backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <span>开始记录</span>
            <Icon name="arrow_forward" size={16} />
          </button>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <button
            className="text-left bg-white dark:bg-card-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow"
            onClick={() => navigate('/stats')}
          >
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-3">
              <Icon name="local_fire_department" fill />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{streakDays}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">连续记录 (天)</div>
          </button>
          <button
            className="text-left bg-white dark:bg-card-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow"
            onClick={() => navigate('/calendar')}
          >
            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 mb-3">
              <Icon name="calendar_month" fill />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{currentMonth}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">当前月份</div>
          </button>
        </section>

        <section className="bg-white dark:bg-card-dark rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-soft">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">快捷查看</h3>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => navigate('/history')} className="py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold">时间线</button>
            <button onClick={() => navigate('/stats')} className="py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold">趋势</button>
            <button onClick={() => navigate('/settings')} className="py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold">设置</button>
          </div>
        </section>

        <section
          className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700/50 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setQuoteIndex((quoteIndex + 1) % QUOTES.length)}
        >
          <div className="flex items-start justify-between">
            <Icon name="format_quote" className="text-primary/20 text-4xl" />
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Icon name="refresh" size={14} />
              <span>点击换一条</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic mt-2">"{QUOTES[quoteIndex].text}"</p>
          <div className="text-right mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">— {QUOTES[quoteIndex].author}</div>
        </section>
      </main>
    </div>
  );
};

