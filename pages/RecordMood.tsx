import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import {
  clearRecordDraftV2,
  createEntryV2,
  fetchActivityGroups,
  fetchRecentActivities,
  getRecordDraftV2,
  saveRecordDraftV2,
  uploadAudio,
  uploadImage
} from '../services';
import { ActivityGroupWithItems, AudioClip, MoodScore, RecentActivityItem, RecordDraftV2 } from '../types';
import { MOOD_LEVELS, MOOD_SCORE_DEFAULT } from '../src/constants/moodV2';
import { toLocalDateString } from '../src/utils/date';
import { cancelTodayRemainingNotifications } from '../src/services/notifications';
import { confirmAction, showToast } from '../src/ui/feedback';

const MAX_AUDIO_SECONDS = 120;
const isNative = Capacitor.isNativePlatform();

const isDraftEmpty = (draft: RecordDraftV2): boolean => {
  return (
    draft.mood_score === MOOD_SCORE_DEFAULT &&
    draft.activity_ids.length === 0 &&
    draft.quick_note.trim().length === 0 &&
    draft.full_note.trim().length === 0 &&
    draft.location.trim().length === 0 &&
    draft.images.length === 0 &&
    draft.audio_clips.length === 0
  );
};

export const RecordMood: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBusy, setAudioBusy] = useState(false);

  useEffect(() => {
    void initPage();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    void saveRecordDraftV2({
      mood_score: moodScore,
      activity_ids: activityIds,
      quick_note: quickNote,
      full_note: fullNote,
      location,
      images,
      audio_clips: audioClips
    });
  }, [moodScore, activityIds, quickNote, fullNote, location, images, audioClips, loading]);

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
      setAudioClips(draft.audio_clips || []);
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

  const currentDraft: RecordDraftV2 = useMemo(() => ({
    mood_score: moodScore,
    activity_ids: activityIds,
    quick_note: quickNote,
    full_note: fullNote,
    location,
    images,
    audio_clips: audioClips
  }), [moodScore, activityIds, quickNote, fullNote, location, images, audioClips]);

  const extrasSummary = useMemo(() => {
    const parts: string[] = [];
    if (location.trim()) parts.push('已添加位置');
    if (images.length > 0) parts.push(`已添加 ${images.length} 张图片`);
    if (audioClips.length > 0) parts.push('已留下声音片段');
    return parts.join(' · ') || '位置、图片和声音日志都可以留在这里';
  }, [location, images.length, audioClips.length]);

  const handleBack = async () => {
    if (isDraftEmpty(currentDraft) || saving) {
      navigate('/home', { replace: true });
      return;
    }

    const shouldLeave = await confirmAction({
      title: '离开这次记录？',
      message: '未保存的内容会保留在草稿里，下次回来还能继续写。',
      confirmText: '先离开',
      cancelText: '继续写',
      confirmTone: 'primary'
    });

    if (shouldLeave) {
      navigate('/home', { replace: true });
    }
  };

  const handleToggleActivity = (activityId: number) => {
    setActivityIds((prev) => prev.includes(activityId)
      ? prev.filter((id) => id !== activityId)
      : [...prev, activityId]);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const stopRecordingTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleStartRecording = async () => {
    if (!isNative || isRecording || audioBusy) return;
    if (audioClips.length >= 1) {
      showToast('首版每条记录先保留 1 条声音片段', 'error');
      return;
    }

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('当前设备暂不支持录音', 'error');
      return;
    }

    try {
      setAudioBusy(true);
      const stream = await mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stopRecordingTimer();
        stopTracks();
        setIsRecording(false);
        setAudioBusy(false);

        const durationSec = recordingSeconds;
        setRecordingSeconds(0);

        if (chunksRef.current.length === 0 || durationSec <= 0) return;

        try {
          const ext = 'webm';
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
          const result = await uploadAudio(blob, ext);
          const clip: AudioClip = {
            id: `${Date.now()}`,
            url: result.url,
            durationSec,
            createdAt: new Date().toISOString()
          };
          setAudioClips([clip]);
          showToast('声音片段已保存到草稿', 'success');
        } catch (error: any) {
          console.error('保存音频失败:', error);
          showToast(error?.message || '保存声音片段失败', 'error');
        }
      };

      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_AUDIO_SECONDS && recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error('开始录音失败:', error);
      setAudioBusy(false);
      stopTracks();
      showToast('麦克风权限未开启或设备不支持录音', 'error');
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
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
        audio_clips: audioClips,
        activity_ids: activityIds
      });

      await clearRecordDraftV2();
      try {
        await cancelTodayRemainingNotifications();
      } catch (notificationError) {
        console.error('取消当天提醒失败:', notificationError);
      }
      showToast('记录已保存', 'success');
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
            <h1 className="text-lg font-extrabold tracking-tight">记录一下</h1>
            <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">把此刻留住，晚点再慢慢回看。</p>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="ui-action-primary !w-auto min-w-[88px] px-4"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className="page-content pb-8 overflow-y-auto">
        <section className="ui-card ui-card--hero p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4 text-center">
            <p className="ui-card-title mb-1">情绪梯度</p>
            <h2 className="text-lg font-extrabold">现在的你，更靠近哪一种状态？</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LEVELS.map((item) => {
              const active = moodScore === item.score;
              return (
                <button
                  key={item.score}
                  onClick={() => setMoodScore(item.score)}
                  className="flex flex-col items-center gap-2 rounded-[18px] px-1 py-2 transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.72)' : 'transparent',
                    boxShadow: active ? '0 16px 28px -22px rgba(79,71,61,0.28)' : 'none',
                    transform: active ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <MoodFaceIcon mood={item} size={56} />
                  <span className="text-[10px] font-bold leading-4 sm:text-[11px]" style={{ color: item.displayColor }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ui-card p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="ui-card-title mb-1">活动</p>
              <h2 className="text-base font-extrabold">已经选了 {activityIds.length} 项</h2>
            </div>
            <button className="ui-action-secondary min-h-9 px-3" onClick={() => navigate('/settings/tags')}>
              <Icon name="tune" size={16} />
              管理活动
            </button>
          </div>

          {recentActivities.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-xs font-bold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">最近常用</div>
              <div className="flex flex-wrap gap-2">
                {recentActivities.map((activity) => {
                  const selected = activityIds.includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleToggleActivity(activity.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${selected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)] border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]'}`}
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
                <div key={group.id} className="overflow-hidden rounded-[20px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-bold">{group.name}</div>
                      <div className="text-[11px] text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{group.activities.length} 个可选活动</div>
                    </div>
                    <Icon name={expanded ? 'expand_less' : 'expand_more'} />
                  </button>

                  {expanded && (
                    <div className="flex flex-wrap gap-2 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                      {group.activities.map((activity) => {
                        const selected = activityIds.includes(activity.id);
                        return (
                          <button
                            key={activity.id}
                            onClick={() => handleToggleActivity(activity.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${selected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white/75 dark:bg-white/5 border-[var(--ui-border-subtle-light)] dark:border-[var(--ui-border-subtle-dark)] text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]'}`}
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">快记一句</p>
              <h2 className="text-base font-extrabold">先留下这一刻最想记住的话</h2>
            </div>
            <button onClick={() => navigate('/record/note')} className="ui-inline-action">
              打开完整笔记
            </button>
          </div>

          <div className="ui-input-shell">
            <input
              type="text"
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              placeholder="比如：今天终于松了一口气。"
              className="ui-input"
            />
          </div>

          {fullNote.trim().length > 0 && (
            <p className="mt-3 line-clamp-2 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">完整笔记：{fullNote}</p>
          )}
        </section>

        <section className="ui-card p-4 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setShowExtras((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="ui-card-title mb-1">附加信息</p>
              <p className="text-sm font-semibold">{extrasSummary}</p>
            </div>
            <Icon name={showExtras ? 'expand_less' : 'expand_more'} />
          </button>

          {showExtras && (
            <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="ui-field-label">位置</label>
                <div className="ui-input-shell mt-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="如果想记住这是在哪里发生的"
                    className="ui-input"
                  />
                </div>
              </div>

              <div>
                <label className="ui-field-label">图片（可选）</label>
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
                  {uploading ? '上传中...' : '添加图片'}
                </button>

                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative size-16 overflow-hidden rounded-2xl bg-[var(--ui-surface-muted-light)] dark:bg-[var(--ui-surface-muted-dark)]">
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

              {isNative && (
                <div>
                  <label className="ui-field-label">声音日志</label>
                  <div className="mt-2 rounded-[22px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/72 p-4 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/78">
                    <button
                      type="button"
                      onPointerDown={() => void handleStartRecording()}
                      onPointerUp={handleStopRecording}
                      onPointerLeave={handleStopRecording}
                      onPointerCancel={handleStopRecording}
                      disabled={audioBusy || audioClips.length >= 1}
                      className={`flex w-full items-center justify-center gap-3 rounded-[18px] px-4 py-4 text-sm font-semibold transition ${isRecording ? 'bg-primary text-white' : 'bg-white/80 text-[var(--ui-text-primary-light)] dark:bg-white/6 dark:text-[var(--ui-text-primary-dark)]'}`}
                    >
                      <Icon name={isRecording ? 'radio_button_checked' : 'mic'} size={18} />
                      {isRecording ? `松开结束 · ${recordingSeconds}s` : audioClips.length >= 1 ? '已保存 1 条声音片段' : '长按开始录音'}
                    </button>
                    <p className="mt-3 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">首版先支持 1 条声音片段，最长 {MAX_AUDIO_SECONDS} 秒。</p>

                    {audioClips.map((clip) => (
                      <div key={clip.id} className="mt-3 rounded-[18px] bg-white/72 p-3 dark:bg-white/6">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">声音片段 · {clip.durationSec}s</span>
                          <button
                            type="button"
                            onClick={() => setAudioClips([])}
                            className="text-xs font-semibold text-rose-500"
                          >
                            删除
                          </button>
                        </div>
                        <audio controls className="w-full">
                          <source src={clip.url} />
                        </audio>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

