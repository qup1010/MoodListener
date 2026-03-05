/**
 * 统计分析页面
 * 展示情绪趋势和统计数据
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Icon } from '../components/Icon';
import { fetchStats, StatsData, fetchEntries } from '../services';
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
        { name: '积极', value: stats.mood_distribution.positive_percent, color: '#F5928C' },
        { name: '中性', value: stats.mood_distribution.neutral_percent, color: '#A2D9CE' },
        { name: '消极', value: stats.mood_distribution.negative_percent, color: '#6B4F5E' }
      ]
    : [];

  const healthScore = stats
    ? Math.round(stats.mood_distribution.positive_percent + stats.mood_distribution.neutral_percent * 0.5)
    : 0;

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

      <main className="px-4 pt-4 flex flex-col gap-6 pb-28">
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">连续</div>
            <div className="text-2xl font-extrabold text-[#121617] dark:text-white">{stats?.streak_days || 0}<span className="text-sm font-medium text-gray-500 ml-1">天</span></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">总记录</div>
            <div className="text-2xl font-extrabold text-[#121617] dark:text-white">{stats?.total_entries || 0}<span className="text-sm font-medium text-gray-500 ml-1">篇</span></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">健康度</div>
            <div className="text-2xl font-extrabold text-primary">{healthScore}<span className="text-sm font-medium text-gray-500 ml-1">%</span></div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
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
          <div className="relative h-48 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#355c5f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#355c5f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#355c5f"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    dot={trendData.length <= 15 ? { fill: '#355c5f', r: 4, strokeWidth: 0 } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">暂无数据</div>
            )}
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
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-[#121617] dark:text-white mb-6">情绪占比分析</h3>
          <div className="flex items-center gap-8">
            <div className="relative size-32 shrink-0">
              <div className="w-full h-full transform -rotate-90">
                {pieData.length > 0 && pieData.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={50} outerRadius={64} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="size-28 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-primary dark:text-mood-neutral">{healthScore}%</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase">健康度</span>
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
        </section>

        <section className="bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 p-5 rounded-2xl mb-8">
          <div className="flex items-start gap-3">
            <Icon name="auto_awesome" className="text-primary dark:text-mood-neutral" />
            <div>
              <h4 className="text-sm font-bold text-primary dark:text-mood-neutral mb-1">本期洞察</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {stats && stats.total_entries > 0
                  ? <>你已经记录了 <span className="font-bold text-gray-900 dark:text-white">{stats.total_entries}</span> 条心情日记，其中积极情绪占 <span className="font-bold text-gray-900 dark:text-white">{stats.mood_distribution.positive_percent}%</span>。继续保持记录习惯吧。</>
                  : <>开始记录你的心情，获取个性化的情绪洞察。</>}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
