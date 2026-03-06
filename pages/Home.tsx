import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchStatsV2, getWeeklyInsightV2, refreshWeeklyInsightV2, saveRecordDraftV2, WeeklyInsightV2 } from '../services';
import { HOME_QUOTES, homeCopy } from '../src/constants/copywriting';
import { HomeHeroState, HomeInsightCardModel, MoodScore } from '../types';
import { showToast } from '../src/ui/feedback';
import { MOOD_LEVELS } from '../src/constants/moodV2';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ total_entries: number; streak_days: number }>({ total_entries: 0, streak_days: 0 });
  const [insight, setInsight] = useState<WeeklyInsightV2 | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightRefreshing, setInsightRefreshing] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    void loadData();
    setQuoteIndex(Math.floor(Math.random() * HOME_QUOTES.length));
  }, []);

  const loadData = async () => {
    setInsightLoading(true);
    try {
      const [statsData, weeklyInsight] = await Promise.all([
        fetchStatsV2(),
        getWeeklyInsightV2()
      ]);

      setStats({ total_entries: statsData.total_entries, streak_days: statsData.streak_days });
      setInsight(weeklyInsight);
    } catch (error) {
      console.error('加载首页数据失败:', error);
    } finally {
      setInsightLoading(false);
    }
  };

  const refreshInsight = async () => {
    setInsightRefreshing(true);
    try {
      const next = await refreshWeeklyInsightV2(true);
      setInsight(next);
      showToast('洞察已刷新', 'success');
    } catch (error) {
      console.error('刷新洞察失败:', error);
      showToast('刷新失败，请重试', 'error');
    } finally {
      setInsightRefreshing(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早安';
    if (hour < 14) return '午安';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  }, []);

  const heroState: HomeHeroState = useMemo(() => ({
    greeting,
    username: '',
    summary: stats.total_entries === 0
      ? homeCopy.defaultSummary
      : stats.streak_days >= 7
        ? homeCopy.streakSummary(stats.streak_days)
        : homeCopy.totalSummary(stats.total_entries),
    streakLabel: `${stats.streak_days} 天`,
    totalLabel: `${stats.total_entries} 条`,
    ctaLabel: homeCopy.heroAction
  }), [greeting, stats]);

  const handleQuickStart = async (score: MoodScore) => {
    try {
      await saveRecordDraftV2({ mood_score: score });
      navigate('/record');
    } catch (error) {
      console.error('写入草稿失败:', error);
      showToast('进入记录页失败，请重试', 'error');
    }
  };

  const insightCard: HomeInsightCardModel = useMemo(() => {
    if (!insight || insight.recordCount === 0) {
      return {
        title: homeCopy.insightTitle,
        subtitle: '最近完整 7 天',
        keyValue: homeCopy.insightEmptyKey,
        keyLabel: homeCopy.insightEmptyLabel,
        supportingLabel: homeCopy.insightEmptySupporting,
        suggestion: insight?.suggestion || '先保持频率，趋势会比结论更先出现。',
        topActivities: []
      };
    }

    const deltaLabel = `${insight.moodDelta.delta >= 0 ? '+' : ''}${insight.moodDelta.delta.toFixed(1)}`;
    return {
      title: homeCopy.insightTitle,
      subtitle: `${insight.weekStart} 至 ${insight.weekEnd}`,
      keyValue: insight.averageMood.toFixed(1),
      keyLabel: '本周平均情绪',
      supportingLabel: `7天记录 ${insight.recordCount} 次 · 较上周 ${deltaLabel}`,
      suggestion: insight.suggestion,
      topActivities: insight.topActivities.slice(0, 3).map((item) => `${item.name} ${item.count}次`)
    };
  }, [insight]);

  return (
    <div className="page-shell flex min-h-screen flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-5 pt-8 pb-2">
        <div>
          <h1 className="page-title">{heroState.greeting}</h1>
          <p className="page-subtitle">{homeCopy.headerSupport}</p>
        </div>
      </header>

      <main className="page-content flex-1 !pt-2 overflow-y-auto pb-6">
        <section className="ui-card ui-card--hero p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-[28px] border border-[var(--ui-border-strong-light)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),rgba(255,255,255,0)_70%)] p-6 shadow-sm dark:border-[var(--ui-border-strong-dark)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]">
            <div className="mb-6">
              <div className="text-[1.45rem] font-extrabold leading-tight text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
                {heroState.ctaLabel}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {MOOD_LEVELS.map((item) => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => void handleQuickStart(item.score)}
                  className="rounded-[26px] border border-[var(--ui-border-subtle-light)] bg-white/90 px-1 py-5 transition-all hover:-translate-y-1 hover:border-white/80 active:scale-[0.98] dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/[0.06]"
                  style={{ boxShadow: '0 12px 24px -16px ' + item.color }}
                >
                  <div className="mx-auto flex size-[3.25rem] items-center justify-center rounded-full border border-white/80 dark:border-white/15" style={{ backgroundColor: item.softColor, color: item.color }}>
                    <Icon name={item.icon} size={28} />
                  </div>
                  <div className="mt-3 whitespace-nowrap text-center text-[12px] font-semibold leading-4 text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-card ui-card--subtle p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="ui-card-title mb-2.5">{homeCopy.heroEyebrow}</p>
              <h2 className="max-w-[16rem] text-[1.4rem] font-bold leading-tight text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
                {heroState.summary}
              </h2>
            </div>
            <div className="ui-icon-chip shadow-sm">
              <Icon name="wb_twilight" size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="ui-kpi shadow-sm">
              <div className="mb-1.5 text-[12px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{homeCopy.streakLabel}</div>
              <div className="text-[1.1rem] font-bold">{heroState.streakLabel}</div>
            </div>
            <div className="ui-kpi shadow-sm">
              <div className="mb-1.5 text-[12px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{homeCopy.totalLabel}</div>
              <div className="text-[1.1rem] font-bold">{heroState.totalLabel}</div>
            </div>
          </div>
        </section>

        <section className="ui-card p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1.5">{insightCard.title}</p>
              <p className="text-[13px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{insightCard.subtitle}</p>
            </div>
            <button
              onClick={() => void refreshInsight()}
              disabled={insightLoading || insightRefreshing}
              className="ui-action-secondary min-h-[36px] px-3.5"
            >
              <Icon name="refresh" size={16} />
              <span className="text-[13px]">{insightRefreshing ? homeCopy.insightRefreshing : homeCopy.insightRefresh}</span>
            </button>
          </div>

          {insightLoading ? (
            <div className="flex flex-col gap-3 py-2">
              <div className="ui-skeleton h-4 w-28" />
              <div className="ui-skeleton h-10 w-32 rounded-2xl" />
              <div className="ui-skeleton h-3 w-full rounded-md" />
              <div className="ui-skeleton h-3 w-4/5 rounded-md" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-1.5 text-[12px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{insightCard.keyLabel}</div>
                  <div className="text-[1.75rem] font-bold tracking-tight text-[var(--ui-brand-primary)] dark:text-primary">{insightCard.keyValue}</div>
                </div>
                <div className="rounded-[20px] bg-[var(--ui-surface-muted-light)]/60 px-4 py-3 sm:text-right dark:bg-[var(--ui-surface-muted-dark)]/50">
                  <div className="mb-0.5 text-[11px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">本周状态</div>
                  <div className="text-[13.5px] font-medium leading-relaxed text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">{insightCard.supportingLabel}</div>
                </div>
              </div>

              {insightCard.topActivities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insightCard.topActivities.map((item) => (
                    <span key={item} className="rounded-full bg-[var(--ui-brand-primary)]/10 px-3.5 py-1.5 text-[13px] font-medium text-[var(--ui-brand-primary)]">
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-[20px] bg-[var(--ui-surface-muted-light)]/40 p-4 border border-[var(--ui-border-subtle-light)]/50 dark:bg-[var(--ui-surface-muted-dark)]/30 dark:border-[var(--ui-border-subtle-dark)]/50">
                <div className="mb-2 text-[12px] font-semibold text-[var(--ui-brand-primary)]">一句建议</div>
                <p className="text-[14px] leading-relaxed text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">{insightCard.suggestion}</p>
              </div>
            </div>
          )}
        </section>

        <section className="ui-card ui-card--subtle cursor-pointer p-6 animate-in fade-in slide-in-from-bottom-2 shadow-sm" onClick={() => setQuoteIndex((prev) => (prev + 1) % HOME_QUOTES.length)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1.5">{homeCopy.quoteTitle}</p>
              <p className="text-[13px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{homeCopy.quoteAction}</p>
            </div>
            <div className="ui-icon-chip size-10 shadow-sm">
              <Icon name="auto_awesome" size={18} />
            </div>
          </div>
          <p className="mt-5 text-[1.05rem] font-medium italic leading-relaxed text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">“{HOME_QUOTES[quoteIndex].text}”</p>
          <div className="mt-5 text-right text-[13px] font-bold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">— {HOME_QUOTES[quoteIndex].author}</div>
        </section>
      </main>
    </div>
  );
};