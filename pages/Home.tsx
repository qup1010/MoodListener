/**
 * 首页
 * 展示用户问候、快捷入口和统计概览
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchStats, fetchProfile, UserProfile } from '../services';

// 正能量语录列表
const QUOTES = [
  { text: "生活不是等待风暴过去，而是学会在雨中跳舞。", author: "维维安·格林" },
  { text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采" },
  { text: "你若盛开，蝴蝶自来；你若精彩，天自安排。", author: "佚名" },
  { text: "不要因为走得太远，而忘记为什么出发。", author: "纪伯伦" },
  { text: "生命中最困难的时刻，往往是最接近转机的时刻。", author: "佚名" },
  { text: "做你自己，因为别人都有人做了。", author: "奥斯卡·王尔德" },
  { text: "今天的努力是为了将来更好的自己。", author: "佚名" },
  { text: "每一天都是一个新的开始，不要让昨天的阴影遮住今天的阳光。", author: "佚名" },
  { text: "心若向阳，无畏悲伤。", author: "佚名" },
  { text: "不管前方的路有多苦，只要走的方向正确，一切都会变得柔和。", author: "宫崎骏" },
  { text: "生活总会给你答案的，但不会马上把一切都告诉你。", author: "顾城" },
  { text: "把期望降低，把依赖变少，你会过得很好。", author: "佚名" },
  { text: "世界上只有一种英雄主义，就是认清生活的真相后依然热爱生活。", author: "罗曼·罗兰" },
  { text: "愿你眼中总有光芒，愿你活成你想要的模样。", author: "佚名" },
  { text: "别害怕走弯路，走弯路就是走路。", author: "稻盛和夫" },
  { text: "所有的最好，都不如刚刚好。", author: "佚名" },
  { text: "星光不问赶路人，时光不负有心人。", author: "佚名" },
  { text: "凡是过往，皆为序章。", author: "莎士比亚" },
  { text: "与其担心未来，不如现在努力。", author: "佚名" },
  { text: "热爱可抵岁月漫长。", author: "佚名" },
  { text: "人生没有白走的路，每一步都算数。", author: "李宗盛" },
  { text: "当你凝视深渊时，深渊也在凝视你。", author: "尼采" },
  { text: "只要心里有光，就会感应到世界的光亮。", author: "佚名" },
  { text: "生活明朗，万物可爱。", author: "佚名" },
  { text: "愿你走出半生，归来仍是少年。", author: "佚名" },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [streakDays, setStreakDays] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    loadData();
    setCurrentMonth(getMonthName());
    // 随机选择一条语录
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, [location]);

  const loadData = async () => {
    try {
      const [stats, userProfile] = await Promise.all([
        fetchStats(),
        fetchProfile()
      ]);
      setStreakDays(stats.streak_days);
      setProfile(userProfile);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  /**
   * 获取当前月份名称
   */
  const getMonthName = (): string => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[new Date().getMonth()];
  };

  /**
   * 根据时间获取问候语
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早安';
    if (hour < 14) return '午安';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const username = profile?.username || '朋友';
  // 确保头像URL有效
  const savedAvatar = profile?.avatar_url;
  const avatarUrl = (savedAvatar && (savedAvatar.startsWith('http') || savedAvatar.startsWith('data:')))
    ? savedAvatar
    : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex';

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-primary dark:text-primary mb-1">{getGreeting()}，{username}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">准备好拥抱今天了吗？</p>
          </div>
          <div
            className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/settings')}
          >
            <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6 overflow-y-auto pb-6">
        {/* 签到卡片 */}
        <section
          onClick={() => navigate('/record')}
          className="relative overflow-hidden bg-primary dark:bg-card-dark rounded-3xl p-6 shadow-glow cursor-pointer group transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Icon name="mood" size={120} className="text-white" />
          </div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-4">
              每日签到
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">你现在感觉如何？</h2>
            <p className="text-white/80 text-sm mb-6 max-w-[200px]">记录当下的情绪，让内心更加平静。</p>
            <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
              <span>开始记录</span>
              <Icon name="arrow_forward" size={16} />
            </div>
          </div>
        </section>

        {/* 统计概览 */}
        <section className="grid grid-cols-2 gap-4">
          <div
            className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/stats')}
          >
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-3">
              <Icon name="local_fire_department" fill />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{streakDays}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">连续记录 (天)</div>
          </div>
          <div
            className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/calendar')}
          >
            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 mb-3">
              <Icon name="calendar_month" fill />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{currentMonth}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">当前月份</div>
          </div>
        </section>

        {/* 每日金句 - 点击切换 */}
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
          <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic mt-2">
            "{QUOTES[quoteIndex].text}"
          </p>
          <div className="text-right mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">— {QUOTES[quoteIndex].author}</div>
        </section>
      </main>
    </div>
  );
};
