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
const AUDIO_PERMISSION_KEY = 'moodlistener.audioPermissionRequested';

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

  const requestMicrophoneStream = async () => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('\u5f53\u524d\u8bbe\u5907\u6682\u4e0d\u652f\u6301\u5f55\u97f3', 'error');
      return null;
    }

    try {
      const stream = await mediaDevices.getUserMedia({ audio: true });
      window.localStorage.setItem(AUDIO_PERMISSION_KEY, '1');
      return stream;
    } catch (error) {
      console.error('request microphone permission failed:', error);
      showToast('\u9700\u8981\u5148\u5141\u8bb8\u9ea6\u514b\u98ce\u6743\u9650\uff0c\u624d\u80fd\u5f00\u59cb\u5f55\u97f3', 'error');
      return null;
    }
  };

  const handleStartRecording = async () => {
    if (!isNative || isRecording || audioBusy) return;
    if (audioClips.length >= 1) {
      showToast('\u9996\u7248\u6bcf\u6761\u8bb0\u5f55\u5148\u4fdd\u7559 1 \u6761\u58f0\u97f3\u7247\u6bb5', 'error');
      return;
    }

    try {
      setAudioBusy(true);
      const stream = await requestMicrophoneStream();
      if (!stream) {
        setAudioBusy(false);
        return;
      }

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
          showToast('\u58f0\u97f3\u7247\u6bb5\u5df2\u4fdd\u5b58\u5230\u8349\u7a3f', 'success');
        } catch (error: any) {
          console.error('\u4fdd\u5b58\u97f3\u9891\u5931\u8d25:', error);
          showToast(error?.message || '\u4fdd\u5b58\u58f0\u97f3\u7247\u6bb5\u5931\u8d25', 'error');
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
      console.error('\u5f00\u59cb\u5f55\u97f3\u5931\u8d25:', error);
      setAudioBusy(false);
      stopTracks();
      showToast('\u9ea6\u514b\u98ce\u6743\u9650\u672a\u5f00\u542f\u6216\u8bbe\u5907\u4e0d\u652f\u6301\u5f55\u97f3', 'error');
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
            className="sketch-icon-button size-10"
          >
            <Icon name="arrow_back_ios_new" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-extrabold italic tracking-tight">记录一下</h1>
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
        <section className="ui-card ui-card--hero ui-card--scrapbook ui-card--note p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4 text-center">
            <p className="scrapbook-stamp mb-2">情绪梯度</p>
            <h2 className="scrapbook-title text-lg font-extrabold">现在的你，更靠近哪一种状态？</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LEVELS.map((item, index) => {
              const active = moodScore === item.score;
              return (
                <button
                  key={item.score}
                  onClick={() => setMoodScore(item.score)}
                  className={`scrapbook-polaroid flex flex-col items-center gap-2 px-1 py-2 transition-all ${active ? 'border-[var(--ui-text-primary-light)] bg-[var(--ui-surface-card-light)] shadow-[3px_3px_0_rgba(44,44,44,0.18)] dark:border-[var(--ui-text-primary-dark)] dark:bg-[var(--ui-surface-card-dark)]' : ''}`}
                  style={{ transform: active ? 'rotate(-1deg) translateY(-1px)' : `rotate(${index % 2 === 0 ? '-0.8deg' : '0.7deg'})` }}
                >
                  <MoodFaceIcon mood={item} size={56} />
                  <span className="text-[10px] font-bold leading-4 sm:text-[11px]" style={{ color: item.displayColor }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ui-card ui-card--scrapbook ui-card--ledger p-4 animate-in fade-in slide-in-from-bottom-2">
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
                      className={`sketch-chip ${selected ? 'sketch-chip--active' : 'sketch-chip--stamp'}`}
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
                <div key={group.id} className="ui-card ui-card--subtle ui-card--scrapbook overflow-hidden p-0">
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
                            className={`sketch-chip ${selected ? 'sketch-chip--active' : 'sketch-chip--stamp'}`}
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

        <section className="ui-card ui-card--subtle ui-card--scrapbook ui-card--note p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="ui-card-title mb-1">快记一句</p>
              <h2 className="text-base font-extrabold">先留下这一刻最想记住的话</h2>
            </div>
            <button onClick={() => navigate('/record/note')} className="ui-inline-action">
              打开完整笔记
            </button>
          </div>

          <div className="ui-input-shell ui-input-shell--scrapbook">
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

        <section className="ui-card ui-card--scrapbook ui-card--note p-4 animate-in fade-in slide-in-from-bottom-2">
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
                <div className="ui-input-shell ui-input-shell--scrapbook mt-2">
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

              {isNative && (
                <div>
                  <label className="ui-field-label">声音日志</label>
                  <div className="mt-2 rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/72 p-4 shadow-[2px_2px_0_rgba(44,44,44,0.1)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/78">
                    <button
                      type="button"
                      onPointerDown={() => void handleStartRecording()}
                      onPointerUp={handleStopRecording}
                      onPointerLeave={handleStopRecording}
                      onPointerCancel={handleStopRecording}
                      disabled={audioBusy || audioClips.length >= 1}
                      className={`flex w-full items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-4 text-sm font-semibold ${isRecording ? 'border-[var(--ui-text-primary-light)] bg-[var(--ui-text-primary-light)] text-[var(--ui-surface-page-light)] dark:border-[var(--ui-text-primary-dark)] dark:bg-[var(--ui-text-primary-dark)] dark:text-[var(--ui-surface-page-dark)]' : 'border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] text-[var(--ui-text-primary-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)] dark:text-[var(--ui-text-primary-dark)]'}`}
                    >
                      <Icon name={isRecording ? 'radio_button_checked' : 'mic'} size={18} />
                      {isRecording ? `松开结束 · ${recordingSeconds}s` : audioClips.length >= 1 ? '已保存 1 条声音片段' : '长按开始录音'}
                    </button>
                    <p className="mt-3 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">首版先支持 1 条声音片段，最长 {MAX_AUDIO_SECONDS} 秒。</p>

                    {audioClips.map((clip) => (
                      <div key={clip.id} className="mt-3 rounded-[12px] border-2 border-dashed border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-card-light)] p-3 shadow-[2px_2px_0_rgba(44,44,44,0.1)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-card-dark)]">
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

