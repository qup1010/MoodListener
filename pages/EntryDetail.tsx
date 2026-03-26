import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { PageHeader } from '../components/PageHeader';
import { deleteEntryV2, fetchActivityGroups, fetchEntryV2, updateEntryV2, uploadImage } from '../services';
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
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const entryId = Number(params.id);
    if (!params.id || Number.isNaN(entryId) || entryId <= 0) {
      showToast('这条记录不存在或已被删除', 'error');
      navigate('/history', { replace: true });
      return;
    }
    void loadData(entryId);
  }, [navigate, params.id]);

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
      setImages(entryData.images || []);
    } catch (error) {
      console.error('load entry detail failed:', error);
      showToast('这条记录不存在或已被删除', 'error');
      navigate('/history', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    const confirmed = await confirmAction({
      title: '删除记录',
      message: '确定删除这条记录吗？这个操作无法撤销。',
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
        images,
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

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const nextImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadImage(files[i]);
        nextImages.push(result.url);
      }
      setImages(nextImages);
    } catch (error: any) {
      showToast(error?.message || '图片上传失败', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        加载中...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        这条记录不存在或已被删除
      </div>
    );
  }

  const mood = getMoodMeta(editing ? moodScore : entry.mood_score);

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <PageHeader
        className="px-4 py-3"
        title={editing ? '编辑记录' : '记录详情'}
        subtitle={`${entry.date} ${entry.time}`}
        leading={(
          <button onClick={() => navigate('/history', { replace: true })} className="sketch-icon-button flex size-10 items-center justify-center">
            <Icon name="arrow_back_ios_new" size={18} />
          </button>
        )}
        trailing={editing ? (
          <button onClick={() => setEditing(false)} className="ui-action-secondary !w-auto min-w-[4.75rem] px-3 py-2 text-xs">
            取消
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="sketch-icon-button flex size-10 items-center justify-center">
            <Icon name="edit" className="text-primary" size={18} />
          </button>
        )}
      />

      <main className="page-content flex-1 overflow-y-auto pb-32">
        <section className="ui-card ui-card--hero ui-card--scrapbook ui-card--note p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="scrapbook-stamp mb-2">当日切片</p>
              <h2 className="scrapbook-title text-base font-extrabold">{entry.date} {entry.time}</h2>
              <div className="mt-2 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">情绪 {editing ? moodScore : entry.mood_score} / 5</div>
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
                    type="button"
                    onClick={() => setMoodScore(item.score)}
                    className={`scrapbook-polaroid flex flex-col items-center gap-2 px-1 py-2 transition-all ${active ? 'border-[var(--ui-border-strong-light)] bg-[var(--ui-surface-card-light)] shadow-[2px_2px_0_rgba(44,44,44,0.16)] dark:border-[var(--ui-border-strong-dark)] dark:bg-[var(--ui-surface-card-dark)]' : ''}`}
                    style={{ transform: active ? 'rotate(-0.8deg) translateY(-1px)' : `rotate(${item.score % 2 === 0 ? '0.4deg' : '-0.35deg'})` }}
                  >
                    <MoodFaceIcon mood={item} size={42} />
                    <span className="text-[10px] font-bold leading-4" style={{ color: item.displayColor }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="ui-card ui-card--scrapbook ui-card--note p-4">
          <p className="scrapbook-stamp mb-2">速记</p>
          <h3 className="scrapbook-title mb-3 text-sm font-extrabold">快速笔记</h3>
          {editing ? (
            <div className="ui-input-shell ui-input-shell--scrapbook">
              <input
                type="text"
                value={quickNote}
                onChange={(event) => setQuickNote(event.target.value)}
                placeholder="记一句当时最明显的感受"
                className="ui-input"
              />
            </div>
          ) : (
            <div className="sketch-note sketch-note--paper px-3 py-2.5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{entry.quick_note || '暂无'}</p>
            </div>
          )}
        </section>

        <section className="ui-card ui-card--scrapbook ui-card--ledger p-4">
          <p className="scrapbook-stamp mb-2">展开写</p>
          <h3 className="scrapbook-title mb-3 text-sm font-extrabold">完整笔记</h3>
          {editing ? (
            <div className="ui-input-shell ui-input-shell--scrapbook">
              <textarea
                value={fullNote}
                onChange={(event) => setFullNote(event.target.value)}
                rows={6}
                placeholder="把当时的来龙去脉慢慢写下来"
                className="ui-input min-h-[9.5rem] resize-none leading-7"
              />
            </div>
          ) : (
            <div className="sketch-note sketch-note--paper px-3 py-2.5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{entry.full_note || '暂无'}</p>
            </div>
          )}
        </section>

        <section className="ui-card ui-card--scrapbook ui-card--ledger p-4">
          <p className="scrapbook-stamp mb-2">触发因素</p>
          <h3 className="scrapbook-title mb-3 text-sm font-extrabold">活动</h3>
          {editing ? (
            <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.id} className="ui-card ui-card--subtle ui-card--scrapbook p-3">
                  <div className="scrapbook-stamp mb-2">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.activities.map((activity) => {
                      const selected = activityIds.includes(activity.id);
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => toggleActivity(activity.id)}
                          className={`sketch-chip ${selected ? 'sketch-chip--active' : 'sketch-chip--stamp'}`}
                        >
                          {activity.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedActivities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedActivities.map((name, index) => (
                <span key={`${name}-${index}`} className="sketch-chip sketch-chip--active">{name}</span>
              ))}
            </div>
          ) : (
            <div className="sketch-note text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">暂无</div>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="mb-2 text-sm font-bold">位置</div>
          {editing ? (
            <div className="ui-input-shell">
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="比如：办公室、地铁、家里"
                className="ui-input"
              />
            </div>
          ) : (
            <div className="sketch-note sketch-note--paper px-3 py-2.5">
              <p className="text-sm leading-6 text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{entry.location || '暂无'}</p>
            </div>
          )}
        </section>

        <section className="ui-card p-4">
          <div className="mb-2 text-sm font-bold">图片</div>
          {editing ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadImages}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="ui-action-secondary px-4"
              >
                <Icon name="add_photo_alternate" size={16} />
                {uploading ? '上传中...' : '添加图片'}
              </button>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <div key={`${img}-${index}`} className="scrapbook-polaroid relative size-16 overflow-hidden">
                      <img src={img} alt={`图片${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        onClick={() => setImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img, index) => (
                <div key={`${img}-${index}`} className="scrapbook-polaroid overflow-hidden p-1">
                  <img src={img} alt={`记录图片${index + 1}`} className="aspect-square w-full rounded-[10px] object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="sketch-note sketch-note--paper px-3 py-2.5 text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">暂无</div>
          )}
        </section>

        {!!entry.audio_clips?.length && (
          <section className="ui-card p-4">
            <div className="mb-2 text-sm font-bold">声音片段</div>
            <div className="flex flex-col gap-3">
              {entry.audio_clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/72 p-3 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/76"
                  style={{ transform: `rotate(${index % 2 === 0 ? '-0.45deg' : '0.35deg'})` }}
                >
                  <div className="mb-2 text-xs font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">时长 {clip.durationSec} 秒</div>
                  <audio controls className="w-full">
                    <source src={clip.url} />
                  </audio>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] pb-safe dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
        <div className="p-4">
          {editing ? (
            <button onClick={() => void handleSave()} disabled={saving} className="ui-action-primary">
              {saving ? '保存中...' : '保存修改'}
              {!saving && <Icon name="check" size={18} />}
            </button>
          ) : (
            <button onClick={() => void handleDelete()} className="ui-action-secondary text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
              <Icon name="delete" size={18} />
              删除记录
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
