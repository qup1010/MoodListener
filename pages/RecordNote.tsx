/**
 * 完整注释二级编辑页
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { getRecordDraftV2, saveRecordDraftV2 } from '../services';
import { RecordDraftV2 } from '../types';
import { confirmAction, showToast } from '../src/ui/feedback';

export const RecordNote: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RecordDraftV2 | null>(null);
  const [fullNote, setFullNote] = useState('');

  useEffect(() => {
    void loadDraft();
  }, []);

  const loadDraft = async () => {
    setLoading(true);
    try {
      const nextDraft = await getRecordDraftV2();
      setDraft(nextDraft);
      setFullNote(nextDraft.full_note || '');
    } catch (error) {
      console.error('加载草稿失败:', error);
      showToast('加载失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    return (draft?.full_note || '') !== fullNote;
  }, [draft, fullNote]);

  const handleBack = async () => {
    if (!hasChanges) {
      navigate('/record', { replace: true });
      return;
    }

    const shouldLeave = await confirmAction({
      title: '离开完整注释？',
      message: '未保存的修改将丢失，是否离开？',
      confirmText: '离开',
      cancelText: '继续编辑',
      danger: true
    });

    if (shouldLeave) {
      navigate('/record', { replace: true });
    }
  };

  const handleSave = async () => {
    try {
      await saveRecordDraftV2({ full_note: fullNote });
      showToast('完整注释已保存到草稿', 'success');
      navigate('/record', { replace: true });
    } catch (error) {
      console.error('保存完整注释失败:', error);
      showToast('保存失败，请重试', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-[#121617] dark:text-gray-100 font-display antialiased">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
        <button
          onClick={() => void handleBack()}
          className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Icon name="arrow_back_ios_new" />
        </button>
        <h1 className="text-lg font-bold">完整注释</h1>
        <button
          onClick={() => void handleSave()}
          className="h-9 px-3 rounded-lg bg-primary text-white text-sm font-bold"
        >
          保存
        </button>
      </header>

      <main className="px-4 py-4 flex-1 flex flex-col gap-3">
        <div className="ui-card p-4 flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-2">写下更完整的经过和想法（可选）</div>
          <textarea
            value={fullNote}
            onChange={(event) => setFullNote(event.target.value)}
            placeholder="发生了什么？你最在意的点是什么？"
            className="w-full flex-1 min-h-[320px] resize-none bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm leading-relaxed outline-none focus:border-primary/40"
          />
        </div>
      </main>
    </div>
  );
};
