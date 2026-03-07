/**
 * v1.3 统计页（v2 数据）
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
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
          <button onClick={() => void loadStats()} className="flex size-10 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/60 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5">
            <Icon name="refresh" />
          </button>
        </div>
      </header>

      <main className="page-content overflow-y-auto pb-8">
        <section className="ui-card ui-card--hero p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
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
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{statsCopy.totalEntries}</div>
              <div className="text-xl font-extrabold">{stats.total_entries}</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{statsCopy.streakDays}</div>
              <div className="text-xl font-extrabold">{stats.streak_days}</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{statsCopy.averageMood7d}</div>
              <div className="text-xl font-extrabold text-primary">{stats.average_mood_7d || '-'}</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{statsCopy.averageMood30d}</div>
              <div className="text-xl font-extrabold">{stats.average_mood_30d || '-'}</div>
            </div>
          </div>
        </section>

        <section className="ui-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="ui-card-title mb-1">趋势</p>
              <h2 className="text-base font-extrabold">{statsCopy.trendTitle}</h2>
            </div>
            <div className="flex gap-1 rounded-2xl bg-[var(--ui-surface-muted-light)] p-1 dark:bg-[var(--ui-surface-muted-dark)]">
              <button
                onClick={() => setTrendMode('7d')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${trendMode === '7d' ? 'bg-white text-primary shadow-sm dark:bg-white/10' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}
              >
                7天
              </button>
              <button
                onClick={() => setTrendMode('30d')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${trendMode === '30d' ? 'bg-white text-primary shadow-sm dark:bg-white/10' : 'text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]'}`}
              >
                30天
              </button>
            </div>
          </div>

          {!canShowTrend ? (
            <div className="ui-empty-state flex h-40 flex-col items-center justify-center">
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="timeline" size={22} />
              </div>
              <p className="text-sm font-semibold">{trendUnlockRemaining > 0 ? emptyStateCopy.trendLocked(trendUnlockRemaining) : statsCopy.noTrend}</p>
              <p className="page-subtitle mx-auto max-w-[16rem]">{emptyStateCopy.trendUnlockedHint}</p>
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--app-primary))" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="rgb(var(--app-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="value" type="monotone" stroke="rgb(var(--app-primary))" strokeWidth={2.2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="ui-card p-4">
          <p className="ui-card-title mb-1">分布</p>
          <h2 className="mb-4 text-base font-extrabold">{statsCopy.distributionTitle}</h2>
          {stats.total_entries === 0 ? (
            <div className="ui-empty-state">
              <p className="text-sm font-semibold">{statsCopy.noData}</p>
              <p className="page-subtitle mx-auto max-w-[16rem]">先记几次心情，这里才会慢慢有变化。</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.mood_distribution.map((item) => {
                const mood = getMoodMeta(item.score);
                return (
                  <div key={item.score} className="flex items-center gap-3 rounded-[20px] bg-[var(--ui-surface-muted-light)]/72 px-3 py-2 dark:bg-[var(--ui-surface-muted-dark)]/80">
                    <div className="flex w-[5.5rem] items-center gap-2">
                      <MoodFaceIcon mood={mood} size={34} />
                      <span className="text-xs font-semibold" style={{ color: mood.displayColor }}>{mood.label}</span>
                    </div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/75 dark:bg-white/8">
                      <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: mood.color }} />
                    </div>
                    <div className="w-11 text-right text-xs font-medium text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{item.percent}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="ui-card ui-card--subtle p-4">
          <p className="ui-card-title mb-1">活动</p>
          <h2 className="mb-4 text-base font-extrabold">{statsCopy.activityTitle}</h2>
          {stats.top_activities.length === 0 ? (
            <div className="ui-empty-state">
              <p className="text-sm font-semibold">{emptyStateCopy.statsNoActivities}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.top_activities.map((item, index) => (
                <div key={item.activity_id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ui-border-subtle-light)] bg-white/55 px-3 py-3 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{index + 1}</div>
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <span className="whitespace-nowrap text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{item.count} 次 · {item.ratioPercent}%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
