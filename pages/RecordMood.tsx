/**
 * v1.3 记录页（Daylio 风格）
 * 5级情绪 + 活动多选 + 快速笔记
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  clearRecordDraftV2,
  createEntryV2,
  fetchActivityGroups,
  fetchRecentActivities,
  getRecordDraftV2,
  saveRecordDraftV2,
  uploadImage
} from '../services';
import { ActivityGroupWithItems, MoodScore, RecentActivityItem, RecordDraftV2 } from '../types';
import { MOOD_LEVELS, MOOD_SCORE_DEFAULT } from '../src/constants/moodV2';
import { recordCopy } from '../src/constants/copywriting';
import { toLocalDateString } from '../src/utils/date';
import { confirmAction, showToast } from '../src/ui/feedback';

const isDraftEmpty = (draft: RecordDraftV2): boolean => {
  return (
    draft.mood_score === MOOD_SCORE_DEFAULT &&
    draft.activity_ids.length === 0 &&
    draft.quick_note.trim().length === 0 &&
    draft.full_note.trim().length === 0 &&
    draft.location.trim().length === 0 &&
    draft.images.length === 0
  );
};

export const RecordMood: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [groups, setGroups] = useState<ActivityGroupWithItems[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<number[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);

  const [moodScore, setMoodScore] = useState<MoodScore>(MOOD_SCORE_DEFAULT);
  const [activityIds, setActivityIds] = useState<number[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [fullNote, setFullNote] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    void initPage();
  }, []);

  useEffect(() => {
    if (loading) return;

    void saveRecordDraftV2({
      mood_score: moodScore,
      activity_ids: activityIds,
      quick_note: quickNote,
      full_note: fullNote,
      location,
      images
    });
  }, [moodScore, activityIds, quickNote, fullNote, location, images, loading]);

  const initPage = async () => {
    setLoading(true);
    try {
      const [draft, nextGroups, recent] = await Promise.all([
        getRecordDraftV2(),
        fetchActivityGroups(false),
        fetchRecentActivities(6)
      ]);

      setMoodScore(draft.mood_score || MOOD_SCORE_DEFAULT);
      setActivityIds(draft.activity_ids || []);
      setQuickNote(draft.quick_note || '');
      setFullNote(draft.full_note || '');
      setLocation(draft.location || '');
      setImages(draft.images || []);
      setGroups(nextGroups);
      setRecentActivities(recent);
      setExpandedGroupIds(nextGroups.slice(0, 2).map((group) => group.id));
    } catch (error) {
      console.error('初始化记录页失败:', error);
      showToast('初始化失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = activityIds.length;

  const currentDraft: RecordDraftV2 = useMemo(() => ({
    mood_score: moodScore,
    activity_ids: activityIds,
    quick_note: quickNote,
    full_note: fullNote,
    location,
    images
  }), [moodScore, activityIds, quickNote, fullNote, location, images]);

  const extrasSummary = useMemo(() => {
    const parts: string[] = [];
    if (location.trim()) parts.push(recordCopy.extrasLocationDone);
    if (images.length > 0) parts.push(recordCopy.extrasImageCount(images.length));
    return parts.join(' · ') || recordCopy.extrasClosedHint;
  }, [location, images]);

  const handleBack = async () => {
    if (isDraftEmpty(currentDraft) || saving) {
      navigate('/home', { replace: true });
      return;
    }

    const shouldLeave = await confirmAction({
      title: recordCopy.backConfirmTitle,
      message: recordCopy.backConfirmMessage,
      confirmText: recordCopy.backConfirmLeave,
      cancelText: recordCopy.backConfirmStay,
      danger: true
    });

    if (shouldLeave) {
      await clearRecordDraftV2();
      navigate('/home', { replace: true });
    }
  };

  const handleToggleActivity = (activityId: number) => {
    setActivityIds((prev) => {
      if (prev.includes(activityId)) {
        return prev.filter((id) => id !== activityId);
      }
      return [...prev, activityId];
    });
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroupIds((prev) => prev.includes(groupId)
      ? prev.filter((id) => id !== groupId)
      : [...prev, groupId]);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const now = new Date();
      await createEntryV2({
        date: toLocalDateString(now),
        time: now.toTimeString().slice(0, 5),
        mood_score: moodScore,
        quick_note: quickNote.trim(),
        full_note: fullNote.trim(),
        location: location.trim(),
        images,
        activity_ids: activityIds
      });

      await clearRecordDraftV2();
      showToast(recordCopy.saveSuccess, 'success');
      navigate('/history', { replace: true });
    } catch (error) {
      console.error('保存记录失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
        加载中...
      </div>
    );
  }

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => void handleBack()}
            className="size-10 rounded-full flex items-center justify-center bg-white/55 dark:bg-white/5 border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)]"
          >
            <Icon name="arrow_back_ios_new" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-extrabold tracking-tight">{recordCopy.title}</h1>
            <p className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mt-1">{recordCopy.subtitle}</p>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="ui-action-primary !w-auto min-w-[88px] px-4"
          >
            {saving ? recordCopy.saving : recordCopy.save}
          </button>
        </div>
      </header>

      <main className="page-content pb-8 overflow-y-auto">
        <section className="ui-card ui-card--hero p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="ui-card-title mb-1">情绪梯度</p>
              <h2 className="text-lg font-extrabold">{recordCopy.moodPrompt}</h2>
            </div>
            <div className="ui-icon-chip size-10">
              <Icon name="neurology" size={20} />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LEVELS.map((item) => {
              const active = moodScore === item.score;
              return (
                <button
                  key={item.score}
                  onClick={() => setMoodScore(item.score)}
                  className="rounded-[20px] border px-2 py-3.5 flex flex-col items-center gap-1.5 transition-all"
                  style={{
                    borderColor: active ? item.color : 'var(--ui-border-subtle-light)',
                    background: active ? item.softColor : 'rgba(255,255,255,0.55)',
                    transform: active ? 'translateY(-2px) scale(1.02)' : 'none',
                    boxShadow: active ? `0 12px 24px -18px ${item.color}` : 'none'
                  }}
                >
                  <Icon name={item.icon} className="text-[24px]" style={{ color: active ? item.color : 'var(--ui-text-secondary-light)' }} />
                  <span className="text-[10px] font-black tracking-[0.16em]" style={{ color: active ? item.color : 'var(--ui-text-secondary-light)' }}>{item.shortLabel}</span>
                  <span className="text-[11px] font-semibold" style={{ color: active ? item.color : 'var(--ui-text-primary-light)' }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ui-card p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="ui-card-title mb-1">{recordCopy.activityTitle}</p>
              <h2 className="text-base font-extrabold">已选 {selectedCount} 项</h2>
            </div>
            <button className="ui-action-secondary min-h-9 px-3" onClick={() => navigate('/settings/tags')}>
              <Icon name="tune" size={16} />
              管理活动
            </button>
          </div>

          {recentActivities.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mb-2">{recordCopy.recentActivityTitle}</div>
              <div className="flex flex-wrap gap-2">
                {recentActivities.map((activity) => {
                  const selected = activityIds.includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleToggleActivity(activity.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border ${selected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]'}`}
                    >
                      <Icon name={activity.icon || 'label'} size={14} />
                      <span>{activity.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {groups.map((group) => {
              const expanded = expandedGroupIds.includes(group.id);
              return (
                <div key={group.id} className="rounded-[20px] border border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-bold">{group.name}</div>
                      <div className="text-[11px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{group.activities.length} 个活动</div>
                    </div>
                    <Icon name={expanded ? 'expand_less' : 'expand_more'} />
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                      {group.activities.map((activity) => {
                        const selected = activityIds.includes(activity.id);
                        return (
                          <button
                            key={activity.id}
                            onClick={() => handleToggleActivity(activity.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border ${selected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white/75 dark:bg-white/5 border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]'}`}
                          >
                            <Icon name={activity.icon || 'label'} size={14} />
                            <span>{activity.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="ui-card ui-card--subtle p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="ui-card-title mb-1">{recordCopy.quickNoteTitle}</p>
              <h2 className="text-base font-extrabold">先留一句最想记住的话</h2>
            </div>
            <button onClick={() => navigate('/record/note')} className="ui-inline-action">
              {recordCopy.openFullNote}
            </button>
          </div>

          <div className="ui-input-shell">
            <input
              type="text"
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              placeholder={recordCopy.quickNotePlaceholder}
              className="ui-input"
            />
          </div>

          {fullNote.trim().length > 0 && (
            <p className="text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)] mt-3 line-clamp-2">完整注释：{fullNote}</p>
          )}
        </section>

        <section className="ui-card p-4 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setShowExtras((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="ui-card-title mb-1">{recordCopy.extrasTitle}</p>
              <p className="text-sm font-semibold">{extrasSummary}</p>
            </div>
            <Icon name={showExtras ? 'expand_less' : 'expand_more'} />
          </button>

          {showExtras && (
            <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="ui-field-label">{recordCopy.locationLabel}</label>
                <div className="ui-input-shell mt-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={recordCopy.locationPlaceholder}
                    className="ui-input"
                  />
                </div>
              </div>

              <div>
                <label className="ui-field-label">{recordCopy.imagesLabel}</label>
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
                  className="ui-action-secondary mt-2 px-4"
                >
                  <Icon name="add_photo_alternate" size={16} />
                  {uploading ? recordCopy.imageUploading : recordCopy.addImage}
                </button>

                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative size-16 rounded-2xl overflow-hidden bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)]">
                        <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                          className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};