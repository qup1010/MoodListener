import { MoodScore } from '../../types';

export type MoodIconKey = 'ecstatic' | 'happy' | 'okay' | 'upset' | 'awful';
export type MoodIconPackId = 'playful' | 'pebble' | 'minimal' | 'sticker' | 'doodle' | 'tile';

export interface MoodLevelMeta {
  score: MoodScore;
  label: string;
  shortLabel: string;
  color: string;
  softColor: string;
  displayColor: string;
  surfaceColor: string;
  iconKey: MoodIconKey;
  icon: string;
}

export interface MoodIconPackMeta {
  id: MoodIconPackId;
  name: string;
  description: string;
}

export const MOOD_ICON_PACK_STORAGE_KEY = 'mood_icon_pack_id';
export const DEFAULT_MOOD_ICON_PACK_ID: MoodIconPackId = 'playful';

export const MOOD_ICON_PACKS: MoodIconPackMeta[] = [
  { id: 'playful', name: '糖块表情', description: '有点俏皮的方块脸，辨识度最高' },
  { id: 'pebble', name: '圆泡泡', description: '圆润轻松，整体最柔和' },
  { id: 'minimal', name: '极简线稿', description: '更克制，留白更多' },
  { id: 'sticker', name: '贴纸小脸', description: '像小贴纸一样，轮廓更完整' },
  { id: 'doodle', name: '涂鸦手记', description: '随手一画的感觉，轻松一点' },
  { id: 'tile', name: '几何积木', description: '更利落的几何块面，结构感更强' }
];

export const resolveMoodIconPackId = (value?: string | null): MoodIconPackId => {
  if (value === 'soft') return 'pebble';
  if (value === 'scribble') return 'doodle';
  if (value === 'bold') return 'tile';
  if (value === 'playful' || value === 'pebble' || value === 'minimal' || value === 'sticker' || value === 'doodle' || value === 'tile') {
    return value;
  }
  return DEFAULT_MOOD_ICON_PACK_ID;
};

export const readMoodIconPackId = (): MoodIconPackId => {
  if (typeof window === 'undefined') return DEFAULT_MOOD_ICON_PACK_ID;
  return resolveMoodIconPackId(window.localStorage.getItem(MOOD_ICON_PACK_STORAGE_KEY));
};

export const storeMoodIconPackId = (packId: MoodIconPackId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MOOD_ICON_PACK_STORAGE_KEY, resolveMoodIconPackId(packId));
};

export const MOOD_LEVELS: MoodLevelMeta[] = [
  { score: 5, label: '狂喜', shortLabel: '5', color: '#14b8a6', softColor: 'rgba(20,184,166,0.16)', displayColor: '#11bfa9', surfaceColor: '#c7f1ea', iconKey: 'ecstatic', icon: 'sentiment_very_satisfied' },
  { score: 4, label: '开心', shortLabel: '4', color: '#84cc16', softColor: 'rgba(132,204,22,0.16)', displayColor: '#92cf35', surfaceColor: '#ddf2b4', iconKey: 'happy', icon: 'sentiment_satisfied' },
  { score: 3, label: '还行', shortLabel: '3', color: '#38bdf8', softColor: 'rgba(56,189,248,0.16)', displayColor: '#55b4df', surfaceColor: '#c9e8f7', iconKey: 'okay', icon: 'sentiment_neutral' },
  { score: 2, label: '不爽', shortLabel: '2', color: '#f59e0b', softColor: 'rgba(245,158,11,0.16)', displayColor: '#f4a432', surfaceColor: '#f9dfb5', iconKey: 'upset', icon: 'sentiment_dissatisfied' },
  { score: 1, label: '超烂', shortLabel: '1', color: '#ef4444', softColor: 'rgba(239,68,68,0.16)', displayColor: '#ff466f', surfaceColor: '#f6c2cd', iconKey: 'awful', icon: 'mood_bad' }
];

export const MOOD_SCORE_DEFAULT: MoodScore = 3;

export const getMoodMeta = (score: MoodScore): MoodLevelMeta => {
  return MOOD_LEVELS.find((item) => item.score === score) || MOOD_LEVELS[2];
};

export const softenMoodColor = (hex: string, amount = 0.2): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const base = { r: 140, g: 128, b: 116 };
  const channel = (start: number, target: number) => clamp(start + (target - start) * amount);

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgb(${channel(r, base.r)}, ${channel(g, base.g)}, ${channel(b, base.b)})`;
};

export interface DefaultActivityGroupSeed {
  name: string;
  activities: Array<{ name: string; icon: string }>;
}

export const DEFAULT_ACTIVITY_GROUP_SEEDS: DefaultActivityGroupSeed[] = [
  {
    name: '情绪',
    activities: [
      { name: '高兴', icon: 'sentiment_satisfied' },
      { name: '兴奋', icon: 'celebration' },
      { name: '感激', icon: 'favorite' },
      { name: '放松', icon: 'spa' },
      { name: '满足', icon: 'wb_sunny' },
      { name: '疲惫', icon: 'bedtime' },
      { name: '没信心', icon: 'psychology_alt' },
      { name: '无聊', icon: 'eco' },
      { name: '焦虑', icon: 'thunderstorm' },
      { name: '生气', icon: 'volcano' },
      { name: '压力', icon: 'fitness_center' },
      { name: '悲伤', icon: 'water_drop' },
      { name: '绝望', icon: 'waves' }
    ]
  },
  {
    name: '睡眠',
    activities: [
      { name: '良好睡眠', icon: 'bedtime' },
      { name: '中等睡眠', icon: 'hotel' },
      { name: '睡眠不足', icon: 'bed' },
      { name: '午休', icon: 'airline_seat_flat' }
    ]
  },
  {
    name: '工作',
    activities: [
      { name: '高效', icon: 'task_alt' },
      { name: '开会', icon: 'groups' },
      { name: '学习', icon: 'menu_book' },
      { name: '加班', icon: 'work_history' }
    ]
  },
  {
    name: '生活',
    activities: [
      { name: '运动', icon: 'fitness_center' },
      { name: '社交', icon: 'diversity_3' },
      { name: '散步', icon: 'directions_walk' },
      { name: '美食', icon: 'restaurant' }
    ]
  }
];
