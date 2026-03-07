import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { deleteEntryV2, fetchEntriesV2, searchEntriesV2 } from '../services';
import { EntryV2, MoodScore } from '../types';
import { getMoodMeta, softenMoodColor } from '../src/constants/moodV2';
import { confirmAction, showToast } from '../src/ui/feedback';

const formatRelativeDate = (dateText: string) => {
  const [year, month, day] = dateText.split('-').map(Number);
  const target = new Date(year, (month || 1) - 1, day || 1);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
  const monthDayLabel = `${target.getMonth() + 1}月${target.getDate()}日`;

  if (diffDays === 0) return `今天 · ${monthDayLabel}`;
  if (diffDays === -1) return `昨天 · ${monthDayLabel}`;
  if (diffDays === 1) return `明天 · ${monthDayLabel}`;
  return `${target.getFullYear()}年${monthDayLabel}`;
};

const getNotePreview = (entry: EntryV2) => {
  const text = (entry.quick_note || entry.full_note || '').trim();
  return text.length > 0 ? text : null;
};

export const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<EntryV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<MoodScore | null>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      void handleSearch();
      return;
    }

    void loadEntries();
  }, [filterMood]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchEntriesV2(filterMood ? { moodScore: filterMood } : {});
      setEntries(data);
    } catch (error) {
      console.error('加载记录失败:', error);
      showToast('加载失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      await loadEntries();
      return;
    }

    setSearching(true);
    try {
      const data = await searchEntriesV2(query);
      const filtered = filterMood ? data.filter((item) => item.mood_score === filterMood) : data;
      setEntries(filtered);
    } catch (error) {
      console.error('搜索失败:', error);
      showToast('搜索失败，请重试', 'error');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearchQuery('');
    await loadEntries();
  };

  const handleDelete = async (event: React.MouseEvent, entryId: number) => {
    event.stopPropagation();

    const confirmed = await confirmAction({
      title: '删除记录',
      message: '确定删除这条记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      danger: true
    });

    if (!confirmed) return;

    try {
      await deleteEntryV2(entryId);
      setEntries((prev) => prev.filter((item) => Number(item.id) !== entryId));
      showToast('已删除', 'success');
    } catch (error) {
      console.error('删除失败:', error);
      showToast('删除失败，请重试', 'error');
    }
  };

  const filterText = useMemo(() => {
    if (!filterMood) return '全部情绪';
    const mood = getMoodMeta(filterMood);
    return mood.label;
  }, [filterMood]);

  const moodFilters: Array<{ label: string; value: MoodScore | null }> = [
    { label: '全部', value: null },
    ...([5, 4, 3, 2, 1] as MoodScore[]).map((score) => ({
      label: getMoodMeta(score).label,
      value: score
    }))
  ];

  const hideTools = !loading && !searching && entries.length === 0 && !searchQuery.trim() && filterMood === null;

  return (
    <div className="page-shell flex min-h-screen flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-5 pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="page-subtitle">{entries.length} 条记录 · {filterText}</p>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="flex size-11 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/65 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5"
          >
            <Icon name="calendar_month" className="text-primary" />
          </button>
        </div>

        {!hideTools && (
          <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="ui-input-shell flex items-center gap-2 px-4">
              <Icon name="search" className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
                placeholder="搜索笔记、完整内容、活动或地点"
                className="ui-input !px-0"
              />
              {searchQuery && (
                <button
                  onClick={() => void clearSearch()}
                  className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]"
                  aria-label="清空搜索"
                >
                  <Icon name="close" size={18} />
                </button>
              )}
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {moodFilters.map((item) => {
                const active = filterMood === item.value;
                return (
                  <button
                    key={item.label}
                    onClick={() => setFilterMood(item.value)}
                    className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${active ? 'border-white/80 bg-white text-[var(--ui-text-primary-light)] shadow-sm' : 'border-[var(--ui-border-subtle-light)] bg-white/58 text-[var(--ui-text-secondary-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5 dark:text-[var(--ui-text-secondary-dark)]'}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="page-content flex-1 overflow-y-auto pb-6">
        {loading || searching ? (
          <div className="py-12 text-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
            {searching ? '搜索中...' : '加载中...'}
          </div>
        ) : entries.length === 0 ? (
          <div className="ui-empty-state mt-4">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name={searchQuery ? 'search_off' : 'history_edu'} className="text-3xl" />
            </div>
            <p className="text-base font-bold">{searchQuery ? '没有找到匹配记录' : '还没有记录'}</p>
            {!searchQuery && <p className="page-subtitle mx-auto max-w-[15rem]">先记下一次心情，回头看会更有感觉。</p>}
            {!searchQuery && (
              <button onClick={() => navigate('/record')} className="ui-action-primary mx-auto mt-4 max-w-[220px]">
                开始记录
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const mood = getMoodMeta(entry.mood_score);
              const dateLabel = formatRelativeDate(entry.date);
              const activityText = (entry.activities || []).slice(0, 3).map((item) => item.name).join(' · ');
              const preview = getNotePreview(entry);
              const moodTextColor = softenMoodColor(mood.color, 0.3);

              return (
                <article
                  key={entry.id}
                  className="ui-card ui-card--subtle cursor-pointer p-4"
                  onClick={() => navigate(`/entry/${entry.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <MoodFaceIcon mood={mood} size={68} className="mt-1" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                            {dateLabel}
                          </div>
                          <div className="mt-1 flex items-end gap-3">
                            <div className="text-[1.38rem] font-extrabold leading-none sm:text-[1.5rem]" style={{ color: moodTextColor }}>
                              {mood.label}
                            </div>
                            <div className="text-[1.05rem] font-medium text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
                              {entry.time}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(event) => void handleDelete(event, Number(entry.id))}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/58 text-[var(--ui-text-secondary-light)] transition-colors hover:text-red-500 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5 dark:text-[var(--ui-text-secondary-dark)]"
                          aria-label="删除"
                        >
                          <Icon name="more_horiz" size={18} />
                        </button>
                      </div>

                      {activityText && (
                        <p className="mt-3 text-[1rem] font-semibold leading-6 text-[var(--ui-text-secondary-light)] line-clamp-1 dark:text-[var(--ui-text-secondary-dark)]">
                          {activityText}
                        </p>
                      )}

                      {preview && (
                        <p className="mt-3 text-[1.02rem] leading-7 text-[var(--ui-text-primary-light)] line-clamp-2 dark:text-[var(--ui-text-primary-dark)]">
                          {preview}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
