import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MoodFaceIcon } from '../components/MoodFaceIcon';
import { fetchSettings, updateSettings } from '../services';
import { showToast } from '../src/ui/feedback';
import { MOOD_ICON_PACKS, MOOD_LEVELS, MoodIconPackId, resolveMoodIconPackId, storeMoodIconPackId } from '../src/constants/moodV2';

export const IconSettings: React.FC = () => {
  const navigate = useNavigate();
  const [currentPack, setCurrentPack] = useState<MoodIconPackId>('playful');
  const [savingPack, setSavingPack] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPack(resolveMoodIconPackId(localStorage.getItem('mood_icon_pack_id')));
    void loadSettingsStatus();
  }, []);

  const loadSettingsStatus = async () => {
    try {
      const settings = await fetchSettings();
      const nextPack = resolveMoodIconPackId(settings.mood_icon_pack_id);
      setCurrentPack(nextPack);
      storeMoodIconPackId(nextPack);
    } catch (error) {
      // ignore
    }
  };

  const handleIconPackChange = async (packId: MoodIconPackId) => {
    if (packId === currentPack || savingPack) return;
    const previous = currentPack;
    setSavingPack(packId);
    setCurrentPack(packId);
    storeMoodIconPackId(packId);

    try {
      await updateSettings({ mood_icon_pack_id: packId });
    } catch (error) {
      setCurrentPack(previous);
      storeMoodIconPackId(previous);
      showToast('切换失败，请重试', 'error');
    } finally {
      setSavingPack(null);
    }
  };

  return (
    <div className="page-shell relative flex min-h-screen w-full flex-col animate-in fade-in slide-in-from-bottom-2">
      <header className="page-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings', { replace: true })} className="sketch-icon-button size-10 flex items-center justify-center">
            <Icon name="arrow_back_ios_new" />
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--ui-text-primary-light)] dark:text-[var(--ui-text-primary-dark)]">
            自定义情绪图标
          </h1>
        </div>
      </header>

      <main className="page-content flex-1 overflow-y-auto px-4 pb-8">
        <p className="scrapbook-stamp mb-4">贴纸库</p>
        <p className="mb-4 text-sm text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">选择你最喜欢的一套情绪表情风格。</p>
        <div className="grid gap-3">
          {MOOD_ICON_PACKS.map((pack) => {
            const active = currentPack === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => void handleIconPackChange(pack.id)}
                disabled={savingPack !== null}
                className={`ui-card ui-card--scrapbook ui-card--note overflow-hidden p-4 text-left transition-all ${active ? 'border-[var(--ui-text-primary-light)] bg-[var(--ui-surface-card-light)] shadow-[3px_3px_0_rgba(44,44,44,0.14)] dark:border-[var(--ui-text-primary-dark)] dark:bg-[var(--ui-surface-card-dark)]' : 'border-[var(--ui-border-subtle-light)] bg-[var(--ui-surface-muted-light)] dark:border-[var(--ui-border-subtle-dark)] dark:bg-[var(--ui-surface-muted-dark)]'}`}
                style={{ transform: active ? 'rotate(-0.8deg)' : 'rotate(0.3deg)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{pack.name}</div>
                    <div className="mt-1 text-xs text-[var(--ui-text-secondary-light)] dark:text-[var(--ui-text-secondary-dark)]">{pack.description}</div>
                  </div>
                  {active && <span className="scrapbook-stamp">当前使用</span>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  {MOOD_LEVELS.map((mood) => (
                    <div key={`${pack.id}-${mood.score}`} className="flex flex-col items-center gap-1.5">
                      <MoodFaceIcon mood={mood} size={42} packId={pack.id} />
                      <span className="text-[10px] font-semibold" style={{ color: mood.displayColor }}>{mood.label}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
