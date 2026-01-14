/**
 * 历史回顾页面（时间线）
 * 展示用户的心情记录列表，支持搜索
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Entry } from '../types';
import { fetchEntries, searchEntries, deleteEntry } from '../services';

const getMoodColor = (mood: string, type: 'bg' | 'text' | 'border' | 'light-bg' | 'icon-text') => {
  const map: Record<string, Record<string, string>> = {
    positive: {
      bg: 'bg-mood-positive-soft',
      text: 'text-mood-positive-soft',
      border: 'border-mood-positive-soft',
      lightBg: 'bg-mood-positive-soft/10',
      iconText: 'text-white'
    },
    neutral: {
      bg: 'bg-mood-neutral-soft',
      text: 'text-primary-dark',
      border: 'border-mood-neutral-soft',
      lightBg: 'bg-mood-neutral-soft/10',
      iconText: 'text-primary-dark'
    },
    negative: {
      bg: 'bg-mood-negative-soft',
      text: 'text-white',
      border: 'border-mood-negative-soft',
      lightBg: 'bg-mood-negative-soft/10',
      iconText: 'text-white'
    }
  };

  if (type === 'light-bg') return map[mood]?.lightBg || '';
  if (type === 'icon-text') return map[mood]?.iconText || '';
  return map[mood]?.[type] || '';
};

const getMoodIcon = (mood: string) => {
  switch (mood) {
    case 'positive': return 'favorite';
    case 'neutral': return 'sentiment_neutral';
    case 'negative': return 'sentiment_sad';
    default: return 'circle';
  }
};

/**
 * 格式化日期显示
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return '今天';
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';

  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

export const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadEntries();
    }
  }, [filter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await fetchEntries(filter ? { mood: filter as 'positive' | 'neutral' | 'negative' } : {});
      setEntries(data);
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntries();
      return;
    }

    try {
      setIsSearching(true);
      const data = await searchEntries(searchQuery.trim());
      setEntries(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // 阻止点击冒泡到卡片
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      await deleteEntry(id);
      setEntries(entries.filter(e => e.id !== id.toString()));
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEntryClick = (id: string) => {
    navigate(`/entry/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">历史回顾</h1>
          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-95"
          >
            <Icon name="calendar_month" className="text-primary" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Icon name="search" className="text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索记录..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  loadEntries();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-4 overflow-x-auto no-scrollbar w-full">
          <div className="flex gap-3 min-w-max">
            <button
              className={`flex items-center px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95 ${filter === null
                ? 'bg-primary text-white shadow-glow'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              onClick={() => setFilter(null)}
            >
              <span className="text-sm font-semibold">全部时间</span>
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${filter === 'positive'
                ? 'bg-mood-positive text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-mood-positive/50'
                }`}
              onClick={() => setFilter(filter === 'positive' ? null : 'positive')}
            >
              <span className="size-2 rounded-full bg-mood-positive-soft"></span>
              <span className="text-sm font-medium">积极</span>
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${filter === 'neutral'
                ? 'bg-mood-neutral text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-mood-neutral/50'
                }`}
              onClick={() => setFilter(filter === 'neutral' ? null : 'neutral')}
            >
              <span className="size-2 rounded-full bg-mood-neutral-soft"></span>
              <span className="text-sm font-medium">平静</span>
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${filter === 'negative'
                ? 'bg-mood-negative text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-mood-negative/50'
                }`}
              onClick={() => setFilter(filter === 'negative' ? null : 'negative')}
            >
              <span className="size-2 rounded-full bg-mood-negative-soft"></span>
              <span className="text-sm font-medium">消极</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-6 overflow-y-auto">
        {loading || isSearching ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500">{isSearching ? '搜索中...' : '加载中...'}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Icon name={searchQuery ? 'search_off' : 'history_edu'} className="text-gray-400 text-3xl" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">
              {searchQuery ? '没有找到相关记录' : '还没有心情记录'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/record')}
                className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                开始第一条记录
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-10 w-[2px] border-l-2 border-dashed border-gray-300 dark:border-gray-700"></div>
            <div className="flex flex-col gap-8">

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="relative grid grid-cols-[40px_1fr] gap-4 group cursor-pointer"
                  onClick={() => handleEntryClick(entry.id)}
                >
                  <div className="flex flex-col items-center pt-1 z-10">
                    <div className={`flex items-center justify-center size-10 rounded-full ${getMoodColor(entry.mood, 'bg')} ${entry.mood === 'neutral' ? 'text-primary-dark' : 'text-white'} shadow-lg ring-4 ring-background-light dark:ring-background-dark transition-transform group-hover:scale-110`}>
                      <Icon name={getMoodIcon(entry.mood)} size={20} />
                    </div>
                  </div>
                  <div className={`relative flex flex-col bg-white dark:bg-card-dark rounded-xl p-5 shadow-soft border-l-[6px] ${getMoodColor(entry.mood, 'border')} hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{entry.title}</h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
                          {formatDate(entry.date)}, {entry.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/entry/${entry.id}`);
                          }}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          onClick={(e) => handleDelete(e, parseInt(entry.id))}
                        >
                          <Icon name="delete_outline" size={18} />
                        </button>
                      </div>
                    </div>
                    {entry.content && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                        {entry.content}
                      </p>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                            #{tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{entry.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    {/* 图片缩略图 */}
                    {entry.images && entry.images.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {entry.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="size-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {entry.images.length > 3 && (
                          <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                            +{entry.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            </div>
            <div className="flex flex-col items-center justify-center pt-12 pb-4 text-center">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Icon name="history_toggle_off" className="text-gray-400 text-3xl" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">你已到达旅程的起点。</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};