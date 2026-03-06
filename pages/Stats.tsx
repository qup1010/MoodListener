/**
 * 统计分析页面
 * 展示情绪趋势和统计数据
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Icon } from '../components/Icon';
import { fetchStats, StatsData, fetchEntries, StatsDisplayState } from '../services';
import { Entry } from '../types';
import { toLocalDateString } from '../src/utils/date';

type TimePeriod = 'week' | 'month' | 'quarter';

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('week');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, entryData] = await Promise.all([fetchStats(), fetchEntries()]);
      setStats(statsData);
      setEntries(entryData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendData = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const dateMap: Record<string, number> = {};

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateMap[toLocalDateString(date)] = 0;
    }

    entries.forEach((entry) => {
      if (Object.prototype.hasOwnProperty.call(dateMap, entry.date)) {
        dateMap[entry.date] += 1;
      }
    });

    const raw = Object.entries(dateMap).map(([date, count]) => ({ name: date.slice(5), value: count }));

    if (period === 'quarter') return raw.filter((_, index) => index % 3 === 0);
    if (period === 'month') return raw.filter((_, index) => index % 2 === 0);
    return raw;
  }, [entries, period]);

  const pieData = stats
    ? [
        { name: '积极', value: stats.mood_distribution.positive_percent, color: '#4ade80' },
        { name: '中性', value: stats.mood_distribution.neutral_percent, color: '#facc15' },
        { name: '消极', value: stats.mood_distribution.negative_percent, color: '#f87171' }
      ]
    : [];

  const healthScore = stats
    ? Math.round(stats.mood_distribution.positive_percent + stats.mood_distribution.neutral_percent * 0.5)
    : 0;

  const statsDisplay: StatsDisplayState = useMemo(() => {
    const totalEntries = stats?.total_entries || 0;
    const hasEnoughData = totalEntries >= 3;
    return {
      hasEnoughData,
      unlockHint: hasEnoughData ? '' : `再记录 ${3 - totalEntries} 次可解锁健康度`,
      showHealthScore: hasEnoughData,
      healthExplanation: '健康度 = 积极占比 + 0.5 × 中性占比，仅用于观察近期状态趋势。'
    };
  }, [stats]);

  const trendPeak = useMemo(() => {
    if (!trendData.length) return 0;
    return Math.max(...trendData.map((item) => item.value));
  }, [trendData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <span className="text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#121617] dark:text-gray-100 antialiased">
      <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md transition-colors duration-300">
        <div className="size-10 shrink-0" />
        <h2 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">统计分析</h2>
        <button
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          onClick={() => void loadData()}
          aria-label="刷新统计"
        >
          <Icon name="refresh" className="text-[#121617] dark:text-white" size={22} />
        </button>
      </header>

      <main className="px-4 pt-4 flex flex-col gap-4 pb-28">
        <section className="grid grid-cols-3 gap-3">
          <div className="ui-card p-4">
            <div className="ui-card-title mb-2">连续</div>
            <div className="text-2xl font-extrabold text-[#121617] dark:text-white">{stats?.streak_days || 0}<span className="text-sm font-medium text-gray-500 ml-1">天</span></div>
          </div>
          <div className="ui-card p-4">
            <div className="ui-card-title mb-2">总记录</div>
            <div className="text-2xl font-extrabold text-[#121617] dark:text-white">{stats?.total_entries || 0}<span className="text-sm font-medium text-gray-500 ml-1">条</span></div>
          </div>
          <div className="ui-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="ui-card-title">健康度</div>
              <button className="size-5 rounded-full border border-gray-300 dark:border-gray-600 text-[10px] text-gray-500">?</button>
            </div>
            {statsDisplay.showHealthScore ? (
              <div className="text-2xl font-extrabold text-primary">{healthScore}<span className="text-sm font-medium text-gray-500 ml-1">%</span></div>
            ) : (
              <div>
                <div className="text-lg font-bold text-gray-500">待解锁</div>
                <p className="text-[11px] text-gray-400 mt-1">{statsDisplay.unlockHint}</p>
              </div>
            )}
          </div>
        </section>

        <section className="ui-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-[#121617] dark:text-white">情绪趋势</h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {([
                ['week', '一周'],
                ['month', '一月'],
                ['quarter', '三月']
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === value ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">当前周期单日峰值 {trendPeak} 条</p>

          {entries.length === 0 ? (
            <div className="h-44 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 flex flex-col items-center justify-center text-center px-4">
              <Icon name="insights" className="text-gray-400 text-2xl mb-2" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">记录 3 次后解锁趋势</p>
              <p className="text-xs text-gray-400 mt-1">趋势图会展示你在不同时间段的记录节奏。</p>
            </div>
          ) : (
            <>
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c2943e" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#c2943e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#c2943e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      dot={trendData.length <= 15 ? { fill: '#c2943e', r: 3, strokeWidth: 0 } : false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 text-[8px] font-bold text-gray-400 uppercase tracking-tighter px-2 overflow-hidden">
                {trendData.length <= 15 ? (
                  trendData.map((item) => <span key={item.name}>{item.name}</span>)
                ) : (
                  <>
                    <span>{trendData[0]?.name}</span>
                    <span>{trendData[Math.floor(trendData.length / 2)]?.name}</span>
                    <span>{trendData[trendData.length - 1]?.name}</span>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        <section className="ui-card p-5">
          <h3 className="text-lg font-bold text-[#121617] dark:text-white mb-4">情绪占比</h3>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">还没有可分析的数据</p>
              <p className="text-xs text-gray-400 mt-1">完成记录后，这里会显示积极/中性/消极占比。</p>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="relative size-32 shrink-0">
                <div className="w-full h-full transform -rotate-90">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={50} outerRadius={64} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {statsDisplay.showHealthScore ? (
                    <>
                      <span className="text-xl font-extrabold text-primary">{healthScore}%</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">健康度</span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400">待解锁</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#121617] dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">{statsDisplay.healthExplanation}</p>
        </section>

        <section className="ui-card p-4 mb-8 bg-primary/5 border-primary/10">
          <div className="flex items-start gap-3">
            <Icon name="auto_awesome" className="text-primary" />
            <div>
              <h4 className="text-sm font-bold text-primary mb-1">本期洞察</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {stats && stats.total_entries > 0
                  ? <>你已经记录了 <span className="font-bold text-gray-900 dark:text-white">{stats.total_entries}</span> 条，其中积极情绪占 <span className="font-bold text-gray-900 dark:text-white">{stats.mood_distribution.positive_percent}%</span>。继续保持记录节奏。</>
                  : <>先完成 1 条记录，系统会逐步生成你的趋势和洞察。</>}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
