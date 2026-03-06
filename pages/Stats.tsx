/**
 * v1.3 统计页（v2 数据）
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Icon } from '../components/Icon';
import { fetchStatsV2, StatsV2 } from '../services';
import { emptyStateCopy, statsCopy } from '../src/constants/copywriting';
import { getMoodMeta } from '../src/constants/moodV2';

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendMode, setTrendMode] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchStatsV2();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendData = useMemo(() => {
    if (!stats) return [];
    const source = trendMode === '7d' ? stats.trend_7d : stats.trend_30d;
    return source.map((item) => ({
      day: item.day.slice(5),
      value: item.entryCount
    }));
  }, [stats, trendMode]);

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        加载中...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        数据加载失败
      </div>
    );
  }

  const trendUnlockRemaining = Math.max(0, 3 - stats.total_entries);
  const canShowTrend = stats.total_entries >= 3 && trendData.length > 0;

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">{statsCopy.title}</h1>
            <p className="page-subtitle">{statsCopy.subtitle}</p>
          </div>
          <button onClick={() => void loadStats()} className="size-10 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/5 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
            <Icon name="refresh" />
          </button>
        </div>
      </header>

      <main className="page-content pb-8 overflow-y-auto">
        <section className="ui-card ui-card--hero p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="ui-card-title mb-1">{statsCopy.summaryTitle}</p>
              <h2 className="text-lg font-extrabold">最近 30 天的记录节奏</h2>
            </div>
            <div className="ui-icon-chip size-10">
              <Icon name="insights" size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="ui-kpi">
              <div className="text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mb-1">{statsCopy.totalEntries}</div>
              <div className="text-xl font-extrabold">{stats.total_entries}</div>
            </div>
            <div className="ui-kpi">
              <div className="text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mb-1">{statsCopy.streakDays}</div>
              <div className="text-xl font-extrabold">{stats.streak_days}</div>
            </div>
            <div className="ui-kpi">
              <div className="text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mb-1">{statsCopy.averageMood7d}</div>
              <div className="text-xl font-extrabold text-primary">{stats.average_mood_7d || '-'}</div>
            </div>
            <div className="ui-kpi">
              <div className="text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mb-1">{statsCopy.averageMood30d}</div>
              <div className="text-xl font-extrabold">{stats.average_mood_30d || '-'}</div>
            </div>
          </div>
        </section>

        <section className="ui-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="ui-card-title mb-1">趋势</p>
              <h2 className="text-base font-extrabold">{statsCopy.trendTitle}</h2>
            </div>
            <div className="flex gap-1 bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] rounded-2xl p-1">
              <button
                onClick={() => setTrendMode('7d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${trendMode === '7d' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}
              >
                7天
              </button>
              <button
                onClick={() => setTrendMode('30d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${trendMode === '30d' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}
              >
                30天
              </button>
            </div>
          </div>

          {!canShowTrend ? (
            <div className="ui-empty-state h-40 flex flex-col items-center justify-center">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Icon name="timeline" size={22} />
              </div>
              <p className="text-sm font-semibold">{trendUnlockRemaining > 0 ? emptyStateCopy.trendLocked(trendUnlockRemaining) : statsCopy.noTrend}</p>
              <p className="page-subtitle max-w-[16rem] mx-auto">{emptyStateCopy.trendUnlockedHint}</p>
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c2943e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#c2943e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="value" type="monotone" stroke="#c2943e" strokeWidth={2.2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="ui-card p-4">
          <p className="ui-card-title mb-1">分布</p>
          <h2 className="text-base font-extrabold mb-4">{statsCopy.distributionTitle}</h2>
          {stats.total_entries === 0 ? (
            <div className="ui-empty-state">
              <p className="text-sm font-semibold">{statsCopy.noData}</p>
              <p className="page-subtitle max-w-[16rem] mx-auto">先记几次心情，这里才会慢慢有变化。</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.mood_distribution.map((item) => {
                const mood = getMoodMeta(item.score);
                return (
                  <div key={item.score} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-semibold" style={{ color: mood.color }}>{item.score} 分</div>
                    <div className="flex-1 h-3 rounded-full bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: mood.color }} />
                    </div>
                    <div className="w-12 text-right text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{item.percent}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="ui-card ui-card--subtle p-4">
          <p className="ui-card-title mb-1">活动</p>
          <h2 className="text-base font-extrabold mb-4">{statsCopy.activityTitle}</h2>
          {stats.top_activities.length === 0 ? (
            <div className="ui-empty-state">
              <p className="text-sm font-semibold">{emptyStateCopy.statsNoActivities}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.top_activities.map((item, index) => (
                <div key={item.activity_id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 dark:bg-white/5 px-3 py-3 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black">{index + 1}</div>
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] whitespace-nowrap">{item.count} 次 · {item.ratioPercent}%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};