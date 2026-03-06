/**
 * 首页
 * 展示用户问候、主行动和每周洞察
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchStats, fetchProfile, getWeeklyInsight, refreshWeeklyInsight, UserProfile, WeeklyInsight } from '../services';
import { getInitialAvatarDataUrl } from '../src/utils/avatar';
import { HOME_QUOTES } from '../src/constants/copywriting';
import { showToast } from '../src/ui/feedback';

const moodLabels: Record<string, string> = {
  positive: '积极',
  neutral: '中性',
  negative: '消极'
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [streakDays, setStreakDays] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightRefreshing, setInsightRefreshing] = useState(false);

  useEffect(() => {
    void loadData();
    setQuoteIndex(Math.floor(Math.random() * HOME_QUOTES.length));
  }, []);

  const loadData = async () => {
    setInsightLoading(true);
    try {
      const [stats, userProfile, weeklyInsight] = await Promise.all([
        fetchStats(),
        fetchProfile(),
        getWeeklyInsight()
      ]);
      setStreakDays(stats.streak_days);
      setTotalEntries(stats.total_entries);
      setProfile(userProfile);
      setInsight(weeklyInsight);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleRefreshInsight = async () => {
    setInsightRefreshing(true);
    try {
      const refreshed = await refreshWeeklyInsight(true);
      setInsight(refreshed);
      showToast('洞察已刷新', 'success');
    } catch (error) {
      console.error('刷新洞察失败:', error);
      showToast('刷新洞察失败', 'error');
    } finally {
      setInsightRefreshing(false);
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

  const username = profile?.username || '朋友';
  const savedAvatar = profile?.avatar_url;
  const avatarUrl =
    savedAvatar && (savedAvatar.startsWith('http') || savedAvatar.startsWith('data:'))
      ? savedAvatar
      : getInitialAvatarDataUrl(username, '#355c5f');

  const progressText = useMemo(() => {
    if (totalEntries === 0) return '今天从一句话开始，先记录当下感受。';
    if (streakDays >= 7) return `你已连续记录 ${streakDays} 天，状态很稳定。`;
    return `你已经写下 ${totalEntries} 条记录，继续保持。`;
  }, [streakDays, totalEntries]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="px-5 pt-8 pb-2">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-gray-900 dark:text-white mb-1">{getGreeting()}，{username}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">今天也照顾好自己。</p>
          </div>
          <button
            className="size-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/settings/profile')}
            aria-label="个人资料"
          >
            <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto pb-6">
        <section className="ui-card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="ui-card-title mb-1">今日状态</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{progressText}</h2>
            </div>
            <Icon name="self_improvement" size={28} className="text-primary" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl bg-[var(--ui-accent-subtle-light)] dark:bg-gray-800 px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">连续记录</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{streakDays} 天</div>
            </div>
            <div className="rounded-xl bg-[var(--ui-accent-subtle-light)] dark:bg-gray-800 px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">总记录数</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{totalEntries} 条</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/record')}
            className="w-full h-11 rounded-xl bg-primary text-white font-bold hover:brightness-105 active:scale-[0.99] transition-all"
          >
            开始记录
          </button>
        </section>

        <section className="ui-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="ui-card-title">每周洞察</h3>
              {insight && <p className="text-[11px] text-gray-400 mt-1">{insight.weekStart} 至 {insight.weekEnd}</p>}
            </div>
            <button
              onClick={handleRefreshInsight}
              disabled={insightRefreshing || insightLoading}
              className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 disabled:opacity-60"
            >
              {insightRefreshing ? '刷新中...' : '手动刷新'}
            </button>
          </div>

          {insightLoading && <div className="text-sm text-gray-400 py-2">生成洞察中...</div>}

          {!insightLoading && insight && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <div className="text-xs text-gray-500 mb-1">7 天记录次数</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{insight.recordCount}</div>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <div className="text-xs text-gray-500 mb-1">情绪占比变化</div>
                  <div className="flex flex-col gap-1 text-xs">
                    {insight.moodTrend.map((item) => (
                      <div key={item.mood} className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">{moodLabels[item.mood]}</span>
                        <span className={`${item.deltaPercent > 0 ? 'text-emerald-600' : item.deltaPercent < 0 ? 'text-rose-500' : 'text-gray-500'} font-semibold`}>
                          {item.deltaPercent > 0 ? '+' : ''}{item.deltaPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <div className="text-xs text-gray-500 mb-2">高频触发标签</div>
                {insight.topTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insight.topTags.map((tag) => (
                      <span key={tag.tag} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-semibold">
                        {tag.tag} {tag.count} 次
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">本周暂无标签趋势</p>
                )}
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                <div className="text-xs font-semibold text-primary mb-1">建议模板</div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{insight.suggestion}</p>
              </div>
            </div>
          )}
        </section>

        <section
          className="ui-card p-5 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => setQuoteIndex((quoteIndex + 1) % HOME_QUOTES.length)}
        >
          <div className="flex items-start justify-between">
            <h3 className="ui-card-title">今日一句</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Icon name="refresh" size={14} />
              <span>点击换一条</span>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic mt-3">"{HOME_QUOTES[quoteIndex].text}"</p>
          <div className="text-right mt-3 text-xs font-bold text-gray-400">— {HOME_QUOTES[quoteIndex].author}</div>
        </section>
      </main>
    </div>
  );
};
