import { MoodScore } from '../../types';

export type MoodIconKey = 'ecstatic' | 'happy' | 'okay' | 'upset' | 'awful';
export type MoodIconPackId = 'playful' | 'solid' | 'pebble' | 'minimal' | 'sticker' | 'coloredPencilSticker' | 'stamp' | 'pixel' | 'clay' | 'animeSoft' | 'animeCool';

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
  { id: 'solid', name: '实心色块', description: '更饱满厚实的高饱和色彩' },
  { id: 'pebble', name: '圆润泡泡', description: '圆润轻松，整体最柔和' },
  { id: 'minimal', name: '极简线稿', description: '更克制，留白更多' },
  { id: 'sticker', name: '贴纸小脸', description: '像小贴纸一样，轮廓更完整' },
  { id: 'coloredPencilSticker', name: '彩铅贴纸', description: '像手帐里的彩铅贴纸，边缘更柔和可爱' },
  { id: 'stamp', name: '印章小脸', description: '像盖在纸上的橡皮章，克制又有手帐味道' },
  { id: 'pixel', name: '复古像素', description: '回到红白机时代的复古游戏感' },
  { id: 'clay', name: '质感膨胀', description: '模拟黏土与气球的立体解压质感' },
  { id: 'animeSoft', name: '萌系软漫', description: '更圆润、更柔亮的二次元小头像气质' },
  { id: 'animeCool', name: '清冷番剧', description: '更利落、更克制的冷静番剧风表情' }
];

export const resolveMoodIconPackId = (value?: string | null): MoodIconPackId => {
  if (value === 'soft') return 'pebble';
  if (value === 'scribble' || value === 'doodle') return 'playful';
  if (value === 'bold' || value === 'tile') return 'playful';
  if (value === 'playful' || value === 'solid' || value === 'pebble' || value === 'minimal' || value === 'sticker' || value === 'coloredPencilSticker' || value === 'stamp' || value === 'pixel' || value === 'clay' || value === 'animeSoft' || value === 'animeCool') {
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
      { name: '难过', icon: 'water_drop' },
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
