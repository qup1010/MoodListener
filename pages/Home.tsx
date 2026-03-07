import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { fetchRandomTimeCapsule, fetchStatsV2, getWeeklyInsightV2, refreshWeeklyInsightV2, saveRecordDraftV2, TimeCapsuleCard, WeeklyInsightV2 } from '../services';
import { HOME_QUOTES } from '../src/constants/copywriting';
import { buildInsightSummary, describeMoodTemperature } from '../src/constants/moodLanguage';
import { MoodScore } from '../types';
import { MOOD_LEVELS } from '../src/constants/moodV2';
import { showToast } from '../src/ui/feedback';

const homeText = {
  heroEyebrow: '今日状态',
  heroSupporting: '看看今天的状态，也给自己一点留意。',
  heroAction: '你感觉怎么样？',
  streakLabel: '连续记录',
  totalLabel: '总记录数',
  insightTitle: '每周洞察',
  insightRefresh: '刷新',
  insightRefreshing: '刷新中...',
  insightEmptyKey: '待解锁',
  insightEmptyLabel: '每周节奏',
  insightEmptySupporting: '再写几条记录，趋势就会慢慢清晰。'
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ total_entries: number; streak_days: number }>({ total_entries: 0, streak_days: 0 });
  const [insight, setInsight] = useState<WeeklyInsightV2 | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightRefreshing, setInsightRefreshing] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [timeCapsule, setTimeCapsule] = useState<TimeCapsuleCard | null>(null);
  const [timeCapsuleLoading, setTimeCapsuleLoading] = useState(true);

  useEffect(() => {
    void loadData();
    setQuoteIndex(Math.floor(Math.random() * HOME_QUOTES.length));
  }, []);

  const loadData = async () => {
    setInsightLoading(true);
    setTimeCapsuleLoading(true);
    try {
      const [statsData, weeklyInsight, capsule] = await Promise.all([
        fetchStatsV2(),
        getWeeklyInsightV2(),
        fetchRandomTimeCapsule()
      ]);
      setStats({ total_entries: statsData.total_entries, streak_days: statsData.streak_days });
      setInsight(weeklyInsight);
      setTimeCapsule(capsule);
    } catch (error) {
      console.error('加载首页数据失败:', error);
    } finally {
      setInsightLoading(false);
      setTimeCapsuleLoading(false);
    }
  };

  const handleQuickStart = async (score: MoodScore) => {
    try {
      await saveRecordDraftV2({ mood_score: score });
      navigate('/record');
    } catch (error) {
      console.error('写入草稿失败:', error);
      showToast('进入记录页失败，请重试', 'error');
    }
  };

  const refreshTimeCapsule = async () => {
    try {
      const capsule = await fetchRandomTimeCapsule();
      setTimeCapsule(capsule);
    } catch (error) {
      console.error('刷新光阴胶囊失败:', error);
      showToast('刷新回忆失败，请重试', 'error');
    }
  };

  const refreshInsight = async () => {
    setInsightRefreshing(true);
    try {
      const nextInsight = await refreshWeeklyInsightV2(true);
      setInsight(nextInsight);
      showToast('每周洞察已刷新', 'success');
    } catch (error) {
      console.error('刷新洞察失败:', error);
      showToast('刷新失败，请重试', 'error');
    } finally {
      setInsightRefreshing(false);
    }
  };

  const isInsightEmpty = !insight || insight.recordCount === 0;

  const insightMeta = useMemo(() => {
    if (isInsightEmpty) {
      return {
        subtitle: '最近完整 7 天',
        statusText: homeText.insightEmptyKey,
        statusHint: homeText.insightEmptySupporting,
        supportText: '本周状态',
        suggestion: insight?.suggestion || '最近 7 天还没有记录，先从一条快速笔记开始。',
        topActivities: [] as string[]
      };
    }

    const delta = insight?.moodDelta.delta || 0;

    return {
      subtitle: `${insight?.weekStart} 至 ${insight?.weekEnd}`,
      statusText: describeMoodTemperature(insight?.averageMood || 0),
      statusHint: buildInsightSummary(insight?.recordCount || 0, delta),
      supportText: '本周状态',
      suggestion: insight?.suggestion || '继续保持记录，趋势会更清晰。',
      topActivities: (insight?.topActivities || []).slice(0, 3).map((item) => `${item.name} ${item.count}次`)
    };
  }, [insight, isInsightEmpty]);

  return (
    <div className="page-shell flex min-h-screen flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-5 pb-1 pt-6">
        <div className="block max-w-[22rem] text-left">
          <p className="mt-0.5 text-[0.98rem] font-medium italic leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
            {HOME_QUOTES[quoteIndex].text}
          </p>
        </div>
      </header>

      <main className="page-content flex-1 overflow-y-auto !pt-2 pb-6">
        <section className="ui-card ui-card--hero animate-in fade-in slide-in-from-bottom-2 p-5">
          <div className="mb-5 text-center">
            <div
              className="text-[1.92rem] font-black leading-tight sm:text-[2.12rem]"
              style={{
                color: 'var(--ui-brand-primary)',
                WebkitTextStroke: '1px var(--ui-border-strong-light)',
                textShadow: '0 2px 8px rgba(194,148,62,0.15)'
              }}
            >
              {homeText.heroAction}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {MOOD_LEVELS.map((item) => (
              <button
                key={item.score}
                type="button"
                onClick={() => void handleQuickStart(item.score)}
                className="flex flex-col items-center gap-2 rounded-[18px] px-1 py-2 text-center transition-transform hover:-translate-y-1 active:scale-[0.98]"
              >
                <MoodFaceIcon mood={item} size={58} />
                <div className="whitespace-nowrap text-center text-[10px] font-bold leading-4 sm:text-[11px]" style={{ color: item.displayColor }}>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ui-card ui-card--subtle animate-in fade-in slide-in-from-bottom-2 p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="ui-card-title mb-2">{homeText.heroEyebrow}</p>
              <p className="page-subtitle max-w-[16rem]">{homeText.heroSupporting}</p>
            </div>
            <div className="ui-icon-chip">
              <Icon name="wb_twilight" size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{homeText.streakLabel}</div>
              <div className="text-lg font-extrabold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{stats.streak_days} 天</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{homeText.totalLabel}</div>
              <div className="text-lg font-extrabold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{stats.total_entries} 条</div>
            </div>
          </div>
        </section>

        <section className="ui-card animate-in fade-in slide-in-from-bottom-2 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">{homeText.insightTitle}</p>
              <p className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{insightMeta.subtitle}</p>
            </div>
            <button
              onClick={() => void refreshInsight()}
              disabled={insightLoading || insightRefreshing}
              className="ui-action-secondary min-h-9 px-3 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]"
            >
              <Icon name="refresh" size={16} />
              {insightRefreshing ? homeText.insightRefreshing : homeText.insightRefresh}
            </button>
          </div>

          {insightLoading ? (
            <div className="flex flex-col gap-3 py-1">
              <div className="ui-skeleton h-4 w-28" />
              <div className="ui-skeleton h-10 w-32 rounded-2xl" />
              <div className="ui-skeleton h-3 w-full rounded-md" />
              <div className="ui-skeleton h-3 w-4/5 rounded-md" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isInsightEmpty ? (
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] gap-3">
                  <div className="rounded-[24px] bg-[var(--ui-surface-muted-light)] px-4 py-4 dark:bg-[var(--ui-surface-muted-dark)]">
                    <div className="text-[9px] font-normal tracking-[0.01em] text-[var(--ui-text-secondary-light)]/52 dark:text-[var(--ui-text-secondary-dark)]/52">{homeText.insightEmptyLabel}</div>
                    <div className="mt-2 text-[1.42rem] font-semibold leading-none tracking-[-0.02em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]/88">
                      {insightMeta.statusText}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[var(--ui-surface-muted-light)]/78 px-4 py-4 dark:bg-[var(--ui-surface-muted-dark)]/88">
                    <div className="text-[10px] font-medium text-[var(--ui-text-secondary-light)]/72 dark:text-[var(--ui-text-secondary-dark)]/72">本周状态</div>
                    <p className="mt-2 text-[0.92rem] font-medium leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]/88">
                      {insightMeta.statusHint}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
                  <div className="rounded-[24px] bg-[var(--ui-surface-muted-light)] px-4 py-4 dark:bg-[var(--ui-surface-muted-dark)]">
                    <div className="text-[9px] font-normal tracking-[0.01em] text-[var(--ui-text-secondary-light)]/52 dark:text-[var(--ui-text-secondary-dark)]/52">每周节奏</div>
                    <div className="mt-2 text-[1.42rem] font-semibold leading-none tracking-[-0.02em] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]/88">
                      {insightMeta.statusText}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[var(--ui-surface-muted-light)]/78 px-4 py-4 dark:bg-[var(--ui-surface-muted-dark)]/88">
                    <div className="text-[10px] font-medium text-[var(--ui-text-secondary-light)]/72 dark:text-[var(--ui-text-secondary-dark)]/72">{insightMeta.supportText}</div>
                    <p className="mt-2 text-[0.92rem] font-medium leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]/88">
                      {insightMeta.statusHint}
                    </p>
                  </div>
                </div>
              )}

              {insightMeta.topActivities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insightMeta.topActivities.map((item) => (
                    <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-[26px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/72 p-4 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/70">
                <div className="mb-2 text-[11px] font-semibold text-primary">一句建议</div>
                <p className="text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{insightMeta.suggestion}</p>
              </div>
            </div>
          )}
        </section>

        {(timeCapsuleLoading || timeCapsule) && (
          <section className="ui-card ui-card--subtle animate-in fade-in slide-in-from-bottom-2 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="ui-card-title mb-1">那个闪光的瞬间</p>
                <p className="page-subtitle">翻到这里，顺手看看当时的你。</p>
              </div>
              <button
                onClick={() => void refreshTimeCapsule()}
                disabled={timeCapsuleLoading || !timeCapsule}
                className="ui-action-secondary min-h-9 px-3 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]"
              >
                <Icon name="shuffle" size={16} />
                再看一条
              </button>
            </div>

            {timeCapsuleLoading ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="ui-skeleton h-4 w-28" />
                <div className="ui-skeleton h-12 w-full rounded-2xl" />
                <div className="ui-skeleton h-3 w-3/4 rounded-md" />
              </div>
            ) : timeCapsule ? (
              <button
                type="button"
                onClick={() => navigate(`/entry/${timeCapsule.entryId}`)}
                className="w-full rounded-[24px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/78 p-4 text-left transition-transform hover:-translate-y-0.5 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/76"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{timeCapsule.date}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{timeCapsule.moodLabel}</span>
                </div>
                <p className="text-sm font-semibold leading-7 text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">{timeCapsule.highlightText}</p>
                {timeCapsule.activitySummary && (
                  <p className="mt-3 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{timeCapsule.activitySummary}</p>
                )}
              </button>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
};
