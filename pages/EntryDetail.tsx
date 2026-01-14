/**
 * 记录详情页面
 * 查看、编辑和删除心情记录
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchEntry, updateEntry, deleteEntry, fetchTagsByMood, Tag, UpdateEntryData } from '../services';
import { Entry, MoodType } from '../types';

export const EntryDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // 编辑状态
    const [editMood, setEditMood] = useState<MoodType>('positive');
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editTags, setEditTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    useEffect(() => {
        if (id) {
            loadEntry(parseInt(id));
        }
    }, [id]);

    useEffect(() => {
        if (isEditing) {
            loadTagsForMood(editMood);
        }
    }, [editMood, isEditing]);

    const loadEntry = async (entryId: number) => {
        try {
            const data = await fetchEntry(entryId);
            setEntry(data);
            // 初始化编辑状态
            setEditMood(data.mood);
            setEditTitle(data.title);
            setEditContent(data.content || '');
            setEditTags(data.tags || []);
        } catch (error) {
            console.error('加载记录失败:', error);
            alert('记录不存在');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const loadTagsForMood = async (mood: MoodType) => {
        try {
            const tags = await fetchTagsByMood(mood);
            setAvailableTags(tags);
        } catch (error) {
            console.error('加载标签失败:', error);
        }
    };

    const handleSave = async () => {
        if (!entry || !editTitle.trim()) {
            alert('标题不能为空');
            return;
        }

        setSaving(true);
        try {
            const updateData: UpdateEntryData = {
                mood: editMood,
                title: editTitle.trim(),
                content: editContent || undefined,
                tags: editTags
            };

            const updated = await updateEntry(parseInt(entry.id), updateData);
            setEntry(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!entry) return;
        if (!confirm('确定要删除这条记录吗？此操作不可撤销。')) return;

        try {
            await deleteEntry(parseInt(entry.id));
            navigate('/history', { replace: true });
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    const toggleTag = (tagName: string) => {
        if (editTags.includes(tagName)) {
            setEditTags(editTags.filter(t => t !== tagName));
        } else {
            setEditTags([...editTags, tagName]);
        }
    };

    const getMoodInfo = (mood: MoodType) => {
        switch (mood) {
            case 'positive':
                return { label: '积极', icon: 'sentiment_satisfied', color: 'bg-mood-positive', textColor: 'text-mood-positive' };
            case 'neutral':
                return { label: '中性', icon: 'sentiment_neutral', color: 'bg-mood-neutral', textColor: 'text-mood-neutral' };
            case 'negative':
                return { label: '消极', icon: 'sentiment_dissatisfied', color: 'bg-mood-negative', textColor: 'text-mood-negative' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <span className="text-gray-500">加载中...</span>
            </div>
        );
    }

    if (!entry) {
        return null;
    }

    const moodInfo = getMoodInfo(isEditing ? editMood : entry.mood);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display antialiased">
            <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isEditing ? '编辑记录' : '记录详情'}
                </h1>
                {isEditing ? (
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-500 font-medium"
                    >
                        取消
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <Icon name="edit" className="text-primary" />
                    </button>
                )}
            </header>

            <main className="flex-1 px-6 py-6">
                {/* 日期时间 */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Icon name="schedule" size={16} />
                    <span>{entry.date} {entry.time}</span>
                    {entry.location && (
                        <>
                            <span className="mx-1">·</span>
                            <Icon name="location_on" size={16} />
                            <span>{entry.location}</span>
                        </>
                    )}
                </div>

                {/* 情绪选择（编辑模式） */}
                {isEditing ? (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-500 mb-2">情绪</label>
                        <div className="flex gap-2">
                            {(['positive', 'neutral', 'negative'] as MoodType[]).map(mood => {
                                const info = getMoodInfo(mood);
                                return (
                                    <button
                                        key={mood}
                                        onClick={() => setEditMood(mood)}
                                        className={`flex-1 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${editMood === mood
                                                ? `${info.color} text-white border-transparent`
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <Icon name={info.icon} />
                                        {info.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${moodInfo.color} text-white mb-4`}>
                        <Icon name={moodInfo.icon} />
                        <span className="font-medium">{moodInfo.label}</span>
                    </div>
                )}

                {/* 标题 */}
                {isEditing ? (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-2">标题</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>
                ) : (
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{entry.title}</h2>
                )}

                {/* 内容 */}
                {isEditing ? (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-500 mb-2">内容</label>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="写下你的想法..."
                        />
                    </div>
                ) : entry.content ? (
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                        {entry.content}
                    </p>
                ) : null}

                {/* 标签 */}
                {isEditing ? (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-500 mb-2">标签</label>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.name)}
                                    className={`px-4 py-2 rounded-full text-sm transition-all ${editTags.includes(tag.name)
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : entry.tags && entry.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {entry.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                ) : null}

                {/* 图片展示 */}
                {entry.images && entry.images.length > 0 && !isEditing && (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {entry.images.map((img, index) => (
                            <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <img src={img} alt={`图片 ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 底部操作栏 */}
            <div className="p-6 bg-gradient-to-t from-background-light via-background-light/95 to-transparent dark:from-background-dark dark:via-background-dark/95">
                {isEditing ? (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                    >
                        {saving ? '保存中...' : '保存修改'}
                    </button>
                ) : (
                    <button
                        onClick={handleDelete}
                        className="w-full py-4 border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        删除记录
                    </button>
                )}
            </div>
        </div>
    );
};
