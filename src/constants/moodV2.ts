import { MoodScore } from '../../types';

export interface MoodLevelMeta {
  score: MoodScore;
  label: string;
  shortLabel: string;
  color: string;
  softColor: string;
  icon: string;
}

export const MOOD_LEVELS: MoodLevelMeta[] = [
  { score: 5, label: '狂喜', shortLabel: '5', color: '#14b8a6', softColor: 'rgba(20,184,166,0.16)', icon: 'sentiment_very_satisfied' },
  { score: 4, label: '开心', shortLabel: '4', color: '#84cc16', softColor: 'rgba(132,204,22,0.16)', icon: 'sentiment_satisfied' },
  { score: 3, label: '还行', shortLabel: '3', color: '#38bdf8', softColor: 'rgba(56,189,248,0.16)', icon: 'sentiment_neutral' },
  { score: 2, label: '不爽', shortLabel: '2', color: '#f59e0b', softColor: 'rgba(245,158,11,0.16)', icon: 'sentiment_dissatisfied' },
  { score: 1, label: '超烂', shortLabel: '1', color: '#ef4444', softColor: 'rgba(239,68,68,0.16)', icon: 'mood_bad' }
];

export const MOOD_SCORE_DEFAULT: MoodScore = 3;

export const getMoodMeta = (score: MoodScore): MoodLevelMeta => {
  return MOOD_LEVELS.find((item) => item.score === score) || MOOD_LEVELS[2];
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
