/**
 * 日历视图页面
 * 按日历格式展示每日情绪记录
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchEntries, fetchEntriesByDate } from '../services';
import { Entry, MoodType } from '../types';

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [moodMap, setMoodMap] = useState<Record<number, MoodType>>({});
  const [dayEntry, setDayEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取当月天数和起始星期
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  useEffect(() => {
    loadMonthData();
  }, [year, month]);

  useEffect(() => {
    loadDayEntry();
  }, [selectedDate, year, month]);

  /**
   * 加载当月所有记录，构建每日情绪映射
   */
  const loadMonthData = async () => {
    try {
      setLoading(true);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;

      const entries = await fetchEntries({ startDate, endDate });

      // 构建每日最新情绪映射
      const map: Record<number, MoodType> = {};
      entries.forEach(entry => {
        const day = parseInt(entry.date.split('-')[2]);
        // 只保留每天的第一条（最新）
        if (!map[day]) {
          map[day] = entry.mood;
        }
      });

      setMoodMap(map);
    } catch (error) {
      console.error('加载月度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载选中日期的记录详情
   */
  const loadDayEntry = async () => {
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const entries = await fetchEntriesByDate(dateStr);
      setDayEntry(entries.length > 0 ? entries[0] : null);
    } catch (error) {
      console.error('加载日期记录失败:', error);
      setDayEntry(null);
    }
  };

  const getMoodColorClass = (day: number): string => {
    const mood = moodMap[day];
    if (!mood) return 'bg-gray-200 dark:bg-gray-700';
    if (mood === 'positive') return 'bg-mood-positive';
    if (mood === 'neutral') return 'bg-mood-neutral';
    if (mood === 'negative') return 'bg-mood-negative';
    return 'bg-transparent';
  };

  const getMoodInfo = (mood: MoodType) => {
    switch (mood) {
      case 'positive':
        return {
          moodColor: 'text-green-600 dark:text-mood-positive',
          moodBg: 'bg-mood-positive/20',
          tagText: '积极',
          tagClass: 'text-green-700 dark:text-green-300 bg-mood-positive/10 border-mood-positive/20'
        };
      case 'neutral':
        return {
          moodColor: 'text-yellow-600 dark:text-mood-neutral',
          moodBg: 'bg-mood-neutral/20',
          tagText: '平静',
          tagClass: 'text-yellow-700 dark:text-yellow-300 bg-mood-neutral/10 border-mood-neutral/20'
        };
      case 'negative':
        return {
          moodColor: 'text-red-600 dark:text-mood-negative',
          moodBg: 'bg-mood-negative/20',
          tagText: '低落',
          tagClass: 'text-red-700 dark:text-red-300 bg-mood-negative/10 border-mood-negative/20'
        };
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">日历视图</h1>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-95"
          >
            <Icon name="list" className="text-gray-500" />
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-y-auto pb-6">
        <div className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-8">
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              onClick={prevMonth}
            >
              <Icon name="chevron_left" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{year}年 {monthNames[month]}</h2>
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              onClick={nextMonth}
            >
              <Icon name="chevron_right" />
            </button>
          </div>
          <div className="w-full">
            <div className="grid grid-cols-7 mb-4">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-6">
              {emptySlots.map((_, i) => <div key={`empty-${i}`}></div>)}
              {days.map(day => (
                <div
                  key={day}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`size-8 flex items-center justify-center rounded-full transition-all duration-300 ${selectedDate === day
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}>
                    <span className={`text-sm ${selectedDate === day ? 'font-bold' : 'font-medium'}`}>{day}</span>
                  </div>
                  <span className={`size-1.5 rounded-full ${getMoodColorClass(day)}`}></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white/60 dark:bg-card-dark/40 rounded-t-[2.5rem] border-t border-gray-100 dark:border-gray-800 backdrop-blur-sm p-6 shadow-soft z-10 -mt-2">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="event" className="text-primary text-xl" />
            {month + 1}月 {selectedDate}日
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : dayEntry ? (
            <div className="relative flex flex-col bg-white dark:bg-card-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(() => {
                const info = getMoodInfo(dayEntry.mood);
                return (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center size-10 rounded-full ${info.moodBg} ${info.moodColor}`}>
                          <Icon name={dayEntry.mood === 'positive' ? 'sentiment_satisfied' : dayEntry.mood === 'negative' ? 'sentiment_sad' : 'sentiment_neutral'} size={20} fill />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{dayEntry.title}</h3>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{dayEntry.time}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-md border ${info.tagClass}`}>
                        <span className="text-[10px] font-bold tracking-wide uppercase">{info.tagText}</span>
                      </div>
                    </div>
                    {dayEntry.content && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 pl-[52px]">
                        {dayEntry.content}
                      </p>
                    )}
                    {dayEntry.tags && dayEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-[52px]">
                        {dayEntry.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Icon name="history_edu" className="text-4xl mb-2 opacity-50" />
              <p className="text-sm">这一天没有记录</p>
              <button
                onClick={() => navigate('/record')}
                className="mt-4 text-primary font-bold text-sm"
              >
                + 补写日记
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors flex items-center justify-center gap-1 mx-auto hover:bg-primary/5 px-4 py-2 rounded-full"
            >
              <span>查看当天所有记录</span>
              <Icon name="arrow_forward" className="text-base" />
            </button>
          </div>
        </div>
        <div className="h-24 shrink-0"></div>
      </main>
    </div>
  );
};
