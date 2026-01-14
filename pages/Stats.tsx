/**
 * 统计分析页面
 * 展示情绪趋势和统计数据
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Icon } from '../components/Icon';
import { fetchStats, StatsData, fetchEntries } from '../services';

type TimePeriod = 'week' | 'month' | 'quarter';

export const Stats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [trendData, setTrendData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadTrendData(period);
  }, [period]);

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
      // 初始加载周数据
      setTrendData(data.weekly_trend.map(t => ({
        name: t.day.slice(5), // 只显示月-日
        value: t.value
      })));
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async (timePeriod: TimePeriod) => {
    try {
      const days = timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 90;
      const entries = await fetchEntries();

      // 生成日期范围
      const dateMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = 0;
      }

      // 统计每天的记录数
      entries.forEach(entry => {
        if (dateMap.hasOwnProperty(entry.date)) {
          dateMap[entry.date]++;
        }
      });

      // 转换为图表数据
      const data = Object.entries(dateMap).map(([date, count]) => ({
        name: date.slice(5), // 月-日
        value: count
      }));

      // 如果数据太多，进行采样
      if (timePeriod === 'quarter') {
        // 每3天取一个点
        const sampled = data.filter((_, i) => i % 3 === 0);
        setTrendData(sampled);
      } else if (timePeriod === 'month') {
        // 每2天取一个点
        const sampled = data.filter((_, i) => i % 2 === 0);
        setTrendData(sampled);
      } else {
        setTrendData(data);
      }
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  const pieData = stats ? [
    { name: 'Positive', value: stats.mood_distribution.positive_percent, color: '#F5928C' },
    { name: 'Neutral', value: stats.mood_distribution.neutral_percent, color: '#A2D9CE' },
    { name: 'Negative', value: stats.mood_distribution.negative_percent, color: '#6B4F5E' }
  ] : [];

  // 计算健康度（积极+中性的比例）
  const healthScore = stats
    ? Math.round(stats.mood_distribution.positive_percent + stats.mood_distribution.neutral_percent * 0.5)
    : 0;

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
        <div className="size-10 shrink-0"></div>
        <h2 className="text-[#121617] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">统计分析</h2>
        <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <Icon name="share" className="text-[#121617] dark:text-white" size={24} />
        </button>
      </header>
      <main className="px-4 pt-4 flex flex-col gap-6 pb-28">
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="local_fire_department" className="text-mood-highlight" fill />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">连续记录天数</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#121617] dark:text-white">{stats?.streak_days || 0}</span>
              <span className="text-sm font-medium text-gray-500">天</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="history_edu" className="text-primary dark:text-mood-neutral" fill />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">总记录数</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#121617] dark:text-white">{stats?.total_entries || 0}</span>
              <span className="text-sm font-medium text-gray-500">篇</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#121617] dark:text-white">情绪趋势</h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === 'week' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
              >
                一周
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === 'month' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
              >
                一月
              </button>
              <button
                onClick={() => setPeriod('quarter')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === 'quarter' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
              >
                三月
              </button>
            </div>
          </div>
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
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无数据
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4 text-[8px] font-bold text-gray-400 uppercase tracking-tighter px-2 overflow-hidden">
            {trendData.length <= 15 ? trendData.map(d => (
              <span key={d.name}>{d.name}</span>
            )) : (
              <>
                <span>{trendData[0]?.name}</span>
                <span>{trendData[Math.floor(trendData.length / 2)]?.name}</span>
                <span>{trendData[trendData.length - 1]?.name}</span>
              </>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
          <h3 className="text-lg font-bold text-[#121617] dark:text-white mb-6">情绪占比分析</h3>
          <div className="flex items-center gap-8">
            <div className="relative size-32 shrink-0">
              <div className="w-full h-full transform -rotate-90">
                {pieData.length > 0 && pieData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={50}
                        outerRadius={64}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-mood-positive-soft"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">积极</span>
                </div>
                <span className="text-sm font-bold text-[#121617] dark:text-white">
                  {stats?.mood_distribution.positive_percent || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-mood-neutral-soft"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">中性</span>
                </div>
                <span className="text-sm font-bold text-[#121617] dark:text-white">
                  {stats?.mood_distribution.neutral_percent || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-mood-negative-soft"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">消极</span>
                </div>
                <span className="text-sm font-bold text-[#121617] dark:text-white">
                  {stats?.mood_distribution.negative_percent || 0}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 p-5 rounded-2xl mb-8">
          <div className="flex items-start gap-3">
            <Icon name="auto_awesome" className="text-primary dark:text-mood-neutral" />
            <div>
              <h4 className="text-sm font-bold text-primary dark:text-mood-neutral mb-1">本周洞察</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {stats && stats.total_entries > 0 ? (
                  <>
                    你已经记录了 <span className="font-bold text-gray-900 dark:text-white">{stats.total_entries}</span> 条心情日记，
                    其中积极情绪占 <span className="font-bold text-gray-900 dark:text-white">{stats.mood_distribution.positive_percent}%</span>。
                    继续保持记录习惯吧！
                  </>
                ) : (
                  <>开始记录你的心情，获取个性化的情绪洞察。</>
                )}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
