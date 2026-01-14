/**
 * 标签管理页面
 * 三种情绪类型的标签管理，支持添加和删除
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { fetchTags, createTag, deleteTag, TagsByMood, Tag } from '../services';
import { MoodType } from '../types';

export const TagManagement: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState<TagsByMood>({ positive: [], neutral: [], negative: [] });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagMood, setNewTagMood] = useState<MoodType>('positive');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const data = await fetchTags();
            setTags(data);
        } catch (error) {
            console.error('加载标签失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) {
            alert('请输入标签名');
            return;
        }

        setAdding(true);
        try {
            const newTag = await createTag({
                name: newTagName.trim(),
                mood_type: newTagMood
            });

            // 更新本地状态
            setTags(prev => ({
                ...prev,
                [newTagMood]: [...prev[newTagMood], newTag]
            }));

            setNewTagName('');
            setShowAddModal(false);
        } catch (error: any) {
            alert(error.message || '添加失败');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteTag = async (tag: Tag) => {
        if (!confirm(`确定删除标签「${tag.name}」吗？`)) return;

        try {
            await deleteTag(tag.id);

            // 更新本地状态
            setTags(prev => ({
                ...prev,
                [tag.mood_type]: prev[tag.mood_type as keyof TagsByMood].filter(t => t.id !== tag.id)
            }));
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
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

    const renderTagSection = (mood: MoodType, tagList: Tag[]) => {
        const info = getMoodInfo(mood);

        return (
            <section key={mood} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className={`size-6 rounded-full ${info.color} flex items-center justify-center`}>
                        <Icon name={info.icon} className="text-white text-sm" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{info.label}</h3>
                    <span className="text-xs text-gray-400">({tagList.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tagList.map(tag => (
                        <div
                            key={tag.id}
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm"
                        >
                            <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                            <button
                                onClick={() => handleDeleteTag(tag)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                            >
                                <Icon name="close" size={14} />
                            </button>
                        </div>
                    ))}

                    {tagList.length === 0 && (
                        <p className="text-sm text-gray-400 italic">暂无标签</p>
                    )}
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <span className="text-gray-500">加载中...</span>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display antialiased">
            <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon name="arrow_back_ios_new" className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">标签管理</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-md hover:shadow-lg transition-shadow"
                >
                    <Icon name="add" />
                </button>
            </header>

            <main className="flex-1 px-6 py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    管理不同情绪类型的标签，记录心情时会根据情绪自动显示对应标签。
                </p>

                {renderTagSection('positive', tags.positive)}
                {renderTagSection('neutral', tags.neutral)}
                {renderTagSection('negative', tags.negative)}
            </main>

            {/* 添加标签弹窗 */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">添加新标签</h3>

                        <div className="space-y-4">
                            {/* 情绪类型选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">所属情绪</label>
                                <div className="flex gap-2">
                                    {(['positive', 'neutral', 'negative'] as MoodType[]).map(mood => {
                                        const info = getMoodInfo(mood);
                                        return (
                                            <button
                                                key={mood}
                                                onClick={() => setNewTagMood(mood)}
                                                className={`flex-1 py-2 rounded-lg border-2 transition-all ${newTagMood === mood
                                                        ? `${info.color} text-white border-transparent`
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                                    }`}
                                            >
                                                {info.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 标签名输入 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">标签名称</label>
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="如：开心、专注、焦虑..."
                                    maxLength={20}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewTagName('');
                                }}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAddTag}
                                disabled={adding || !newTagName.trim()}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-105 disabled:opacity-50 transition-all"
                            >
                                {adding ? '添加中...' : '确认添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
