import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { deleteEntryV2, fetchActivityGroups, fetchEntryV2, updateEntryV2 } from '../services';
import { ActivityGroupWithItems, EntryV2, MoodScore } from '../types';
import { MOOD_LEVELS, getMoodMeta } from '../src/constants/moodV2';
import { confirmAction, showToast } from '../src/ui/feedback';

export const EntryDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [entry, setEntry] = useState<EntryV2 | null>(null);
  const [groups, setGroups] = useState<ActivityGroupWithItems[]>([]);

  const [moodScore, setMoodScore] = useState<MoodScore>(3);
  const [quickNote, setQuickNote] = useState('');
  const [fullNote, setFullNote] = useState('');
  const [location, setLocation] = useState('');
  const [activityIds, setActivityIds] = useState<number[]>([]);

  useEffect(() => {
    if (!params.id) return;
    void loadData(Number(params.id));
  }, [params.id]);

  const loadData = async (entryId: number) => {
    setLoading(true);
    try {
      const [entryData, activityGroups] = await Promise.all([
        fetchEntryV2(entryId),
        fetchActivityGroups(false)
      ]);

      setEntry(entryData);
      setGroups(activityGroups);
      setMoodScore(entryData.mood_score);
      setQuickNote(entryData.quick_note || '');
      setFullNote(entryData.full_note || '');
      setLocation(entryData.location || '');
      setActivityIds(entryData.activity_ids || []);
    } catch (error) {
      console.error('load entry detail failed:', error);
      showToast('记录不存在或已被删除', 'error');
      navigate('/history', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    const confirmed = await confirmAction({
      title: '删除记录',
      message: '确定删除这条记录吗？此操作不可撤销。',
      confirmText: '删除',
      cancelText: '取消',
      danger: true
    });

    if (!confirmed) return;

    try {
      await deleteEntryV2(Number(entry.id));
      navigate('/history', { replace: true });
    } catch (error) {
      console.error('delete entry failed:', error);
      showToast('删除失败，请重试', 'error');
    }
  };

  const handleSave = async () => {
    if (!entry || saving) return;

    setSaving(true);
    try {
      const updated = await updateEntryV2(Number(entry.id), {
        mood_score: moodScore,
        quick_note: quickNote,
        full_note: fullNote,
        location,
        activity_ids: activityIds
      });

      setEntry(updated);
      setEditing(false);
      showToast('修改已保存', 'success');
    } catch (error) {
      console.error('save entry failed:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = (activityId: number) => {
    setActivityIds((prev) => prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]);
  };

  const selectedActivities = useMemo(() => {
    const map = new Map<number, string>();
    groups.forEach((group) => {
      group.activities.forEach((activity) => {
        map.set(activity.id, activity.name);
      });
    });

    return activityIds.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [groups, activityIds]);

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        {'加载中...'}
      </div>
    );
  }

  if (!entry) return null;

  const mood = getMoodMeta(editing ? moodScore : entry.mood_score);

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate('/history', { replace: true })} className="size-10 rounded-full flex items-center justify-center bg-white/55 dark:bg-white/5 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
            <Icon name="arrow_back_ios_new" />
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
            {editing ? '编辑记录' : '记录详情'}
          </h1>
          {editing ? (
            <button onClick={() => setEditing(false)} className="text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
              {'取消'}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="size-10 rounded-full flex items-center justify-center bg-white/55 dark:bg-white/5 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]">
              <Icon name="edit" className="text-primary" />
            </button>
          )}
        </div>
      </header>

      <main className="page-content flex-1 overflow-y-auto pb-8">
        <section className="ui-card ui-card--hero p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{entry.date} {entry.time}</div>
              <div className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{'情绪 '}{editing ? moodScore : entry.mood_score}{' / 5'}</div>
            </div>
            <MoodFaceIcon mood={mood} size={56} />
          </div>

          {editing && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {MOOD_LEVELS.map((item) => {
                const active = moodScore === item.score;
                return (
                  <button
                    key={item.score}
                    onClick={() => setMoodScore(item.score)}
                    className="flex flex-col items-center gap-2 rounded-[16px] px-1 py-2 transition-all"
                    style={{
                      background: active ? 'rgba(255,255,255,0.72)' : 'transparent',
                      boxShadow: active ? '0 12px 24px -22px rgba(24,22,18,0.35)' : 'none'
                    }}
                  >
                    <MoodFaceIcon mood={item} size={44} />
                    <span className="text-[10px] font-bold leading-4" style={{ color: item.displayColor }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="text-sm font-bold mb-2">{'快速笔记'}</div>
          {editing ? (
            <input
              type="text"
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 px-3 bg-white dark:bg-gray-800"
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.quick_note || '暂无'}</p>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="text-sm font-bold mb-2">{'完整注释'}</div>
          {editing ? (
            <textarea
              value={fullNote}
              onChange={(event) => setFullNote(event.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-3 resize-none bg-white dark:bg-gray-800"
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.full_note || '暂无'}</p>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="text-sm font-bold mb-2">{'活动'}</div>
          {editing ? (
            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="text-xs font-bold text-gray-500 mb-2">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.activities.map((activity) => {
                      const selected = activityIds.includes(activity.id);
                      return (
                        <button
                          key={activity.id}
                          onClick={() => toggleActivity(activity.id)}
                          className={`px-3 py-1.5 rounded-full text-xs border ${selected ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                        >
                          {activity.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedActivities.length > 0 ? selectedActivities.join(' \u00b7 ') : '暂无'}</p>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="text-sm font-bold mb-2">{'位置'}</div>
          {editing ? (
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 bg-white dark:bg-gray-800"
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">{entry.location || '暂无'}</p>
          )}
        </section>
      </main>

      <div className="px-4 pb-6">
        {editing ? (
          <button onClick={() => void handleSave()} disabled={saving} className="w-full h-12 rounded-xl bg-primary text-white font-bold disabled:opacity-60">
            {saving ? '保存中...' : '保存修改'}
          </button>
        ) : (
          <button onClick={() => void handleDelete()} className="w-full h-12 rounded-xl border border-red-400 text-red-500 font-bold">
            {'删除记录'}
          </button>
        )}
      </div>
    </div>
  );
};
