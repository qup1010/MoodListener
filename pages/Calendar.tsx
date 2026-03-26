import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { fetchEntriesV2, fetchEntriesV2ByDate } from '../services';
import { EntryV2, MoodScore } from '../types';
import { getMoodMeta } from '../src/constants/moodV2';

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type DaySummary = {
  date: string;
  count: number;
  averageMood: number;
  moodScore: MoodScore;
};

type HeatmapCell = {
  date: string;
  dayOfWeek: number;
  month: number;
  inCurrentYear: boolean;
  summary: DaySummary | null;
};

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, offset: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const clampMood = (value: number): MoodScore => {
  const rounded = Math.round(value);
  return Math.min(5, Math.max(1, rounded || 3)) as MoodScore;
};

const buildYearHeatmap = (year: number, summaries: Record<string, DaySummary>) => {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  const gridEnd = addDays(lastDay, 6 - lastDay.getDay());
  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / MS_PER_DAY) + 1;

  const cells: HeatmapCell[] = Array.from({ length: totalDays }, (_, index) => {
    const current = addDays(gridStart, index);
    const date = toDateKey(current);
    return {
      date,
      dayOfWeek: current.getDay(),
      month: current.getMonth(),
      inCurrentYear: current.getFullYear() === year,
      summary: summaries[date] || null
    };
  });

  const weekCount = Math.ceil(cells.length / 7);
  const monthMarkers = monthNames
    .map((label, monthIndex) => {
      const monthStart = new Date(year, monthIndex, 1);
      const column = Math.floor((monthStart.getTime() - gridStart.getTime()) / MS_PER_DAY / 7);
      return { label, column };
    })
    .filter((marker, index, list) => index === 0 || marker.column !== list[index - 1].column);

  return { cells, weekCount, monthMarkers };
};

const buildYearSummary = (yearEntries: EntryV2[]) => {
  const daySet = new Set(yearEntries.map((entry) => entry.date));
  const recordedDays = daySet.size;
  const totalEntries = yearEntries.length;
  const averageMood = totalEntries
    ? Number((yearEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / totalEntries).toFixed(1))
    : 0;

  return {
    recordedDays,
    totalEntries,
    averageMood: totalEntries ? averageMood : null
  };
};

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [loadingYear, setLoadingYear] = useState(true);
  const [loadingDay, setLoadingDay] = useState(true);
  const [yearEntries, setYearEntries] = useState<EntryV2[]>([]);
  const [dayEntries, setDayEntries] = useState<EntryV2[]>([]);
  const [daySummaries, setDaySummaries] = useState<Record<string, DaySummary>>({});

  useEffect(() => {
    void loadYearData();
  }, [currentYear]);

  useEffect(() => {
    void loadDayEntries();
  }, [selectedDate]);

  const loadYearData = async () => {
    setLoadingYear(true);
    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      const entries = await fetchEntriesV2({ startDate, endDate });

      const grouped = new Map<string, EntryV2[]>();
      entries.forEach((entry) => {
        const bucket = grouped.get(entry.date) || [];
        bucket.push(entry);
        grouped.set(entry.date, bucket);
      });

      const summaries = Array.from(grouped.entries()).reduce<Record<string, DaySummary>>((acc, [date, list]) => {
        const averageMood = list.reduce((sum, entry) => sum + entry.mood_score, 0) / list.length;
        acc[date] = {
          date,
          count: list.length,
          averageMood: Number(averageMood.toFixed(2)),
          moodScore: clampMood(averageMood)
        };
        return acc;
      }, {});

      setYearEntries(entries);
      setDaySummaries(summaries);

      const nextSelectedDate = summaries[selectedDate]
        ? selectedDate
        : summaries[todayKey] && todayKey.startsWith(`${currentYear}-`)
          ? todayKey
          : Object.keys(summaries).sort().at(-1) || `${currentYear}-01-01`;

      setSelectedDate(nextSelectedDate);
    } catch (error) {
      console.error('加载全年热力图失败:', error);
      setYearEntries([]);
      setDaySummaries({});
      setSelectedDate(`${currentYear}-01-01`);
    } finally {
      setLoadingYear(false);
    }
  };

  const loadDayEntries = async () => {
    setLoadingDay(true);
    try {
      const entries = await fetchEntriesV2ByDate(selectedDate);
      setDayEntries(entries);
    } catch (error) {
      console.error('加载当日记录失败:', error);
      setDayEntries([]);
    } finally {
      setLoadingDay(false);
    }
  };

  const heatmap = useMemo(() => buildYearHeatmap(currentYear, daySummaries), [currentYear, daySummaries]);
  const yearSummary = useMemo(() => buildYearSummary(yearEntries), [yearEntries]);
  const selectedSummary = daySummaries[selectedDate] || null;
  const selectedDateLabel = useMemo(() => {
    const current = parseDateKey(selectedDate);
    return `${current.getMonth() + 1}月${current.getDate()}日`;
  }, [selectedDate]);

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <PageHeader
        className="px-4 py-3"
        title="情绪日历"
        subtitle="把一年摊开来看，你会更容易看见自己的情绪季节。"
        trailing={(
          <button
            onClick={() => navigate('/history')}
            className="sketch-icon-button flex size-10 items-center justify-center"
          >
            <Icon name="list" />
          </button>
        )}
      />

      <main className="page-content overflow-y-auto pb-8">
        <section className="ui-card ui-card--hero p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">年度热力图</p>
              <h2 className="text-lg font-extrabold">{currentYear} 情绪轨迹</h2>
              <p className="page-subtitle max-w-[18rem]">颜色越丰富，这一年就越有被认真生活过的痕迹。</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentYear((value) => value - 1)}
                className="sketch-icon-button flex size-10 items-center justify-center"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                onClick={() => setCurrentYear((value) => value + 1)}
                className="sketch-icon-button flex size-10 items-center justify-center"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">记录天数</div>
              <div className="text-xl font-extrabold">{yearSummary.recordedDays}</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">总记录</div>
              <div className="text-xl font-extrabold">{yearSummary.totalEntries}</div>
            </div>
            <div className="ui-kpi">
              <div className="mb-1 text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">全年温度</div>
              <div className="text-base font-extrabold leading-6">{yearSummary.averageMood ? getMoodMeta(clampMood(yearSummary.averageMood)).label : '-'}</div>
            </div>
          </div>
        </section>

        <section className="ui-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">热力墙</p>
              <h2 className="text-base font-extrabold">全年情绪日历</h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
              <span>低落</span>
              {[1, 2, 3, 4, 5].map((score) => {
                const mood = getMoodMeta(score as MoodScore);
                return <span key={score} className="size-3 rounded-[3px]" style={{ backgroundColor: mood.color }} />;
              })}
              <span>高涨</span>
            </div>
          </div>

          {loadingYear ? (
            <div className="ui-empty-state flex h-52 items-center justify-center">
              <p className="text-sm font-semibold">正在铺开这一年的情绪轨迹...</p>
            </div>
          ) : (
            <div className="rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/68 p-3 shadow-[2px_2px_0_rgba(44,44,44,0.1)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/82">
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[860px]">
                  <div
                    className="mb-2 grid gap-1 pl-8 text-[10px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]"
                    style={{ gridTemplateColumns: `repeat(${heatmap.weekCount}, minmax(0, 1fr))` }}
                  >
                    {heatmap.monthMarkers.map((marker) => (
                      <div key={`${marker.label}-${marker.column}`} style={{ gridColumn: `${marker.column + 1} / span 4` }}>
                        {marker.label}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="grid w-6 shrink-0 gap-1 pt-0.5 text-[10px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                      {weekNames.map((name) => (
                        <div key={name} className="flex h-3 items-center justify-end">{name}</div>
                      ))}
                    </div>

                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${heatmap.weekCount}, minmax(0, 1fr))`,
                        gridTemplateRows: 'repeat(7, minmax(0, 1fr))'
                      }}
                    >
                      {heatmap.cells.map((cell) => {
                        const mood = cell.summary ? getMoodMeta(cell.summary.moodScore) : null;
                        const isSelected = cell.date === selectedDate;
                        const isToday = cell.date === todayKey;

                        return (
                          <button
                            key={cell.date}
                            type="button"
                            onClick={() => cell.inCurrentYear && setSelectedDate(cell.date)}
                            className="size-3 rounded-[3px] transition-transform hover:scale-[1.08]"
                            style={{
                              gridColumn: `${Math.floor((parseDateKey(cell.date).getTime() - parseDateKey(heatmap.cells[0].date).getTime()) / MS_PER_DAY / 7) + 1}`,
                              gridRow: `${cell.dayOfWeek + 1}`,
                              backgroundColor: cell.summary ? mood?.color : 'color-mix(in srgb, var(--ui-surface-card-light) 35%, var(--ui-border-subtle-light) 65%)',
                              opacity: cell.inCurrentYear ? (cell.summary ? 0.95 : 0.72) : 0.22,
                              boxShadow: isSelected
                                ? `0 0 0 2px ${mood?.displayColor || 'var(--ui-brand-primary)'}`
                                : isToday
                                  ? '0 0 0 1.5px var(--ui-border-strong-light)'
                                  : 'none'
                            }}
                            title={cell.inCurrentYear ? `${cell.date}${cell.summary ? ` · ${mood?.label} · ${cell.summary.count}条记录` : ' · 暂无记录'}` : ''}
                            disabled={!cell.inCurrentYear}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">当天详情</p>
              <h2 className="text-base font-extrabold">{selectedDateLabel} 的记录</h2>
            </div>
            <div className="sketch-chip !min-h-0 px-3 py-1 text-xs font-semibold">
              {selectedSummary ? `${selectedSummary.count} 条记录` : '暂无记录'}
            </div>
          </div>

          {selectedSummary && (
            <div className="mb-4 sketch-note px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">当天主色</div>
                  <div className="mt-1 text-lg font-extrabold" style={{ color: getMoodMeta(selectedSummary.moodScore).displayColor }}>
                    {getMoodMeta(selectedSummary.moodScore).label}
                  </div>
                </div>
                <div className="text-right text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                  <div>平均情绪 {selectedSummary.averageMood.toFixed(1)}</div>
                  <div>记录 {selectedSummary.count} 次</div>
                </div>
              </div>
            </div>
          )}

          {loadingDay ? (
            <div className="ui-empty-state">
              <p className="text-sm font-semibold">正在加载当天记录...</p>
            </div>
          ) : dayEntries.length === 0 ? (
            <div className="ui-empty-state">
              <div className="mb-3 flex size-11 items-center justify-center rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] text-primary shadow-[2px_2px_0_rgba(44,44,44,0.08)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
                <Icon name="calendar_month" size={22} />
              </div>
              <p className="text-sm font-semibold">这一天还没有留下记录</p>
              <p className="page-subtitle mx-auto max-w-[16rem]">热力墙会先记住颜色，详细故事等你补上。</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dayEntries.map((entry) => {
                const mood = getMoodMeta(entry.mood_score);
                const activities = (entry.activities || []).map((item) => item.name).slice(0, 3).join(' · ');

                return (
                  <article
                    key={entry.id}
                    className="ui-card cursor-pointer p-4"
                    style={{ transform: `rotate(${Number(entry.id) % 2 === 0 ? '-0.5deg' : '0.45deg'})` }}
                    onClick={() => navigate(`/entry/${entry.id}`)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{entry.time}</span>
                      <span className="text-xs font-bold" style={{ color: mood.displayColor }}>{mood.label}</span>
                    </div>
                    {activities && <p className="mb-1 text-xs font-semibold text-primary">{activities}</p>}
                    {entry.quick_note && <p className="text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{entry.quick_note}</p>}
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
