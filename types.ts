export type MoodType = 'positive' | 'neutral' | 'negative';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mood: MoodType;
  title: string;
  content?: string;
  tags: string[];
  location?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ChartData {
  day: string;
  value: number;
}

