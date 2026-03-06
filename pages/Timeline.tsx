/**
 * v1.3 历史页
 * 仅展示 entries_v2
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { deleteEntryV2, fetchEntriesV2, searchEntriesV2 } from '../services';
import { EntryV2, MoodScore } from '../types';
import { emptyStateCopy } from '../src/constants/copywriting';
import { getMoodMeta } from '../src/constants/moodV2';
import { confirmAction, showToast } from '../src/ui/feedback';

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
    } catch (error) {
      console.error('删除失败:', error);
      showToast('删除失败，请重试', 'error');
    }
  };

  const filterText = useMemo(() => {
    if (!filterMood) return '全部情绪';
    return `${filterMood} 分`;
  }, [filterMood]);

  const moodFilters: Array<{ label: string; value: MoodScore | null }> = [
    { label: '全部', value: null },
    { label: '5分', value: 5 },
    { label: '4分', value: 4 },
    { label: '3分', value: 3 },
    { label: '2分', value: 2 },
    { label: '1分', value: 1 }
  ];

  const hideTools = !loading && !searching && entries.length === 0 && !searchQuery.trim() && filterMood === null;

  return (
    <div className="page-shell flex flex-col min-h-screen animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-5 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">历史回顾</h1>
            <p className="page-subtitle">{entries.length} 条记录 · {filterText}</p>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="size-11 rounded-full bg-white/65 dark:bg-white/5 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] flex items-center justify-center"
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
                placeholder="搜索笔记、完整注释、活动、地点"
                className="ui-input !px-0"
              />
              {searchQuery && (
                <button onClick={() => void clearSearch()} className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]" aria-label="清空搜索">
                  <Icon name="close" size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {moodFilters.map((item) => {
                const active = filterMood === item.value;
                return (
                  <button
                    key={item.label}
                    onClick={() => setFilterMood(item.value)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold border whitespace-nowrap ${active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white/60 dark:bg-white/5 text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)] border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]'}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="page-content flex-1 pb-6 overflow-y-auto">
        {loading || searching ? (
          <div className="py-12 text-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{searching ? '搜索中...' : '加载中...'}</div>
        ) : entries.length === 0 ? (
          <div className="ui-empty-state mt-4">
            <div className="size-14 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center text-primary">
              <Icon name={searchQuery ? 'search_off' : 'history_edu'} className="text-3xl" />
            </div>
            <p className="text-base font-bold">{searchQuery ? emptyStateCopy.historySearchEmpty : emptyStateCopy.historyTitle}</p>
            {!searchQuery && <p className="page-subtitle max-w-[15rem] mx-auto">{emptyStateCopy.historyBody}</p>}
            {!searchQuery && (
              <button onClick={() => navigate('/record')} className="ui-action-primary mt-4 max-w-[220px] mx-auto">
                {emptyStateCopy.historyAction}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const mood = getMoodMeta(entry.mood_score);
              const activityText = (entry.activities || []).slice(0, 3).map((item) => item.name).join(' · ');
              const preview = entry.quick_note || entry.full_note || '这条记录还没有补充文字。';

              return (
                <article
                  key={entry.id}
                  className="ui-card ui-card--subtle p-4 cursor-pointer"
                  onClick={() => navigate(`/entry/${entry.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="size-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: mood.softColor, color: mood.color }}
                      >
                        <Icon name={mood.icon} fill size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-bold truncate">{entry.date} {entry.time}</div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: mood.softColor, color: mood.color }}>
                            {entry.mood_score} 分 · {mood.label}
                          </span>
                        </div>
                        {activityText && <p className="mt-2 text-xs font-semibold text-primary line-clamp-1">{activityText}</p>}
                        <p className="mt-2 text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] line-clamp-1">{preview}</p>
                      </div>
                    </div>
                    <button
                      onClick={(event) => void handleDelete(event, Number(entry.id))}
                      className="text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] hover:text-red-500 shrink-0"
                      aria-label="删除"
                    >
                      <Icon name="delete_outline" size={18} />
                    </button>
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