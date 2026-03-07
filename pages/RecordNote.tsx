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

  const hasChanges = useMemo(() => (draft?.full_note || '') !== fullNote, [draft, fullNote]);

  const handleBack = async () => {
    if (!hasChanges) {
      navigate('/record', { replace: true });
      return;
    }

    const shouldLeave = await confirmAction({
      title: '离开完整笔记？',
      message: '未保存的修改会丢失，确定现在离开吗？',
      confirmText: '离开',
      cancelText: '继续写',
      confirmTone: 'primary'
    });

    if (shouldLeave) {
      navigate('/record', { replace: true });
    }
  };

  const handleSave = async () => {
    try {
      await saveRecordDraftV2({ full_note: fullNote });
      showToast('完整笔记已保存到草稿', 'success');
      navigate('/record', { replace: true });
    } catch (error) {
      console.error('保存完整笔记失败:', error);
      showToast('保存失败，请重试', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">
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
            className="flex size-10 items-center justify-center rounded-full border border-[var(--ui-border-subtle-light)] bg-white/60 dark:border-[var(--ui-border-subtle-dark)] dark:bg-white/5"
          >
            <Icon name="arrow_back_ios_new" size={18} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-extrabold tracking-tight">完整笔记</h1>
            <p className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">把来龙去脉、感受和细节慢慢写完整。</p>
          </div>
          <button onClick={() => void handleSave()} className="ui-action-primary !w-auto min-w-[88px] px-4">
            保存
          </button>
        </div>
      </header>

      <main className="page-content flex-1 pb-6">
        <section className="ui-card min-h-[calc(100vh-8rem)] p-4">
          <div className="mb-3">
            <p className="ui-card-title mb-1">完整记录</p>
            <p className="text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">写下发生了什么、你最在意的片段，或者此刻脑海里还在回响的那句话。</p>
          </div>
          <textarea
            value={fullNote}
            onChange={(event) => setFullNote(event.target.value)}
            placeholder="比如：今天发生了什么？那一刻你心里最明显的感觉是什么？"
            className="min-h-[22rem] w-full flex-1 resize-none rounded-[22px] border border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)]/70 p-4 text-sm leading-7 text-[var(--ui-text-primary-light)] outline-none transition focus:border-primary/40 dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]/72 dark:text-[var(--ui-text-primary-dark)]"
          />
        </section>
      </main>
    </div>
  );
};
