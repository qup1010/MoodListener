/**
 * v1.3 日历页
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchEntriesV2, fetchEntriesV2ByDate } from '../services';
import { EntryV2 } from '../types';
import { getMoodMeta } from '../src/constants/moodV2';

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);
  const [dayEntries, setDayEntries] = useState<EntryV2[]>([]);
  const [moodMap, setMoodMap] = useState<Record<number, number>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const selectedDate = useMemo(() => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [year, month, selectedDay]);

  useEffect(() => {
    void loadMonthData();
  }, [year, month]);

  useEffect(() => {
    void loadDayEntries();
  }, [selectedDate]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const entries = await fetchEntriesV2({ startDate, endDate });

      const nextMap: Record<number, number> = {};
      entries.forEach((entry) => {
        const day = Number(entry.date.split('-')[2]);
        if (!nextMap[day]) {
          nextMap[day] = entry.mood_score;
        }
      });

      setMoodMap(nextMap);
    } catch (error) {
      console.error('加载月视图失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDayEntries = async () => {
    try {
      const entries = await fetchEntriesV2ByDate(selectedDate);
      setDayEntries(entries);
    } catch (error) {
      console.error('加载日期记录失败:', error);
      setDayEntries([]);
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCurrentDate(next);
    setSelectedDay(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">日历</h1>
          <button
            onClick={() => navigate('/history')}
            className="size-10 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center"
          >
            <Icon name="list" className="text-gray-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 pb-6 overflow-y-auto">
        <section className="ui-card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="size-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
              <Icon name="chevron_left" />
            </button>
            <h2 className="text-lg font-bold">{year}年 {monthNames[month]}</h2>
            <button onClick={() => changeMonth(1)} className="size-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
              <Icon name="chevron_right" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {weekNames.map((day) => (
              <div key={day} className="text-center text-xs text-gray-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-3">
            {Array.from({ length: firstDay }, (_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const selected = day === selectedDay;
              const score = moodMap[day];
              const mood = score ? getMoodMeta(score as any) : null;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`size-8 rounded-full flex items-center justify-center text-sm ${selected ? 'bg-primary text-white font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {day}
                  </div>
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: mood ? mood.color : 'rgba(148,163,184,0.6)' }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className="ui-card p-4">
          <div className="text-sm font-bold mb-3">{month + 1}月{selectedDay}日 记录</div>

          {loading ? (
            <p className="text-sm text-gray-500 py-5 text-center">加载中...</p>
          ) : dayEntries.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Icon name="history_edu" className="text-3xl mb-2" />
              <p className="text-sm">这一天没有记录</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dayEntries.map((entry) => {
                const mood = getMoodMeta(entry.mood_score);
                const activities = (entry.activities || []).map((item) => item.name).slice(0, 3).join(' · ');
                return (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 p-3 cursor-pointer"
                    onClick={() => navigate(`/entry/${entry.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{entry.time}</span>
                      <span className="text-xs font-bold" style={{ color: mood.color }}>{entry.mood_score}分 {mood.label}</span>
                    </div>
                    {activities && <p className="text-xs text-primary font-semibold mb-1">{activities}</p>}
                    {entry.quick_note && <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{entry.quick_note}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
