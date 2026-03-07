export type MoodType = 'positive' | 'neutral' | 'negative';
export type MoodScore = 1 | 2 | 3 | 4 | 5;
export type CardTone = 'hero' | 'default' | 'subtle' | 'danger';

export interface AudioClip {
  id: string;
  url: string;
  durationSec: number;
  createdAt: string;
}

export interface Entry {
  id: string;
  date: string;
  time: string;
  mood: MoodType;
  title: string;
  content?: string;
  tags: string[];
  location?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EntryV2 {
  id: string;
  date: string;
  time: string;
  mood_score: MoodScore;
  quick_note?: string;
  full_note?: string;
  location?: string;
  images?: string[];
  audio_clips?: AudioClip[];
  activity_ids: number[];
  activities?: ActivityItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ActivityGroup {
  id: number;
  name: string;
  sort_order: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityItem {
  id: number;
  group_id: number;
  name: string;
  icon?: string;
  sort_order: number;
  is_default: boolean;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityGroupWithItems extends ActivityGroup {
  activities: ActivityItem[];
}

export interface RecentActivityItem {
  id: number;
  group_id: number;
  name: string;
  icon?: string;
  count: number;
  lastUsedAt: string;
}

export interface RecordDraftV2 {
  mood_score: MoodScore;
  activity_ids: number[];
  quick_note: string;
  full_note: string;
  location: string;
  images: string[];
  audio_clips: AudioClip[];
}

export interface ChartData {
  day: string;
  value: number;
}

export interface HomeHeroState {
  greeting: string;
  username: string;
  summary: string;
  streakLabel: string;
  totalLabel: string;
  ctaLabel: string;
}

export interface HomeInsightCardModel {
  title: string;
  subtitle: string;
  keyValue: string;
  keyLabel: string;
  supportingLabel: string;
  suggestion: string;
  topActivities: string[];
}
