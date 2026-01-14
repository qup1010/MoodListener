/**
 * Web 端备用存储层
 * 在浏览器环境中使用 localStorage 模拟 SQLite 功能
 */

import { Capacitor } from '@capacitor/core';

// 检测是否在原生环境中运行
export const isNativePlatform = () => {
    return Capacitor.isNativePlatform();
};

// 默认数据
const DEFAULT_SETTINGS = {
    id: 1,
    notification_enabled: true,
    notification_time: "20:00",
    theme_id: "classic",
    dark_mode: false
};

const DEFAULT_PROFILE = {
    id: 1,
    username: "朋友",
    avatar_url: null
};

const DEFAULT_TAGS = [
    { id: 1, name: '开心', mood_type: 'positive', is_default: true },
    { id: 2, name: '兴奋', mood_type: 'positive', is_default: true },
    { id: 3, name: '感恩', mood_type: 'positive', is_default: true },
    { id: 4, name: '平静', mood_type: 'neutral', is_default: true },
    { id: 5, name: '思考', mood_type: 'neutral', is_default: true },
    { id: 6, name: '疲惫', mood_type: 'neutral', is_default: true },
    { id: 7, name: '难过', mood_type: 'negative', is_default: true },
    { id: 8, name: '焦虑', mood_type: 'negative', is_default: true },
    { id: 9, name: '生气', mood_type: 'negative', is_default: true },
];

// Storage Keys
const KEYS = {
    ENTRIES: 'moodlistener_entries',
    SETTINGS: 'moodlistener_settings',
    PROFILE: 'moodlistener_profile',
    TAGS: 'moodlistener_tags',
    NEXT_ENTRY_ID: 'moodlistener_next_entry_id',
    NEXT_TAG_ID: 'moodlistener_next_tag_id',
};

// 辅助函数
function getItem<T>(key: string, defaultValue: T): T {
    const item = localStorage.getItem(key);
    if (item) {
        try {
            return JSON.parse(item);
        } catch (e) {
            return defaultValue;
        }
    }
    return defaultValue;
}

function setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// 初始化
export function initWebStorage(): void {
    if (!localStorage.getItem(KEYS.SETTINGS)) {
        setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(KEYS.PROFILE)) {
        setItem(KEYS.PROFILE, DEFAULT_PROFILE);
    }
    if (!localStorage.getItem(KEYS.TAGS)) {
        setItem(KEYS.TAGS, DEFAULT_TAGS);
        setItem(KEYS.NEXT_TAG_ID, 10);
    }
    if (!localStorage.getItem(KEYS.ENTRIES)) {
        setItem(KEYS.ENTRIES, []);
        setItem(KEYS.NEXT_ENTRY_ID, 1);
    }

    // 同步主题设置到 localStorage（供 theme.ts 使用）
    const settings = getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (settings.dark_mode !== undefined) {
        localStorage.setItem('darkMode', settings.dark_mode ? 'true' : 'false');
    }
    if (settings.theme_id) {
        localStorage.setItem('themeId', settings.theme_id);
    }
}

// ==================== Entries ====================

export function webFetchEntries(filters: any = {}): any[] {
    let entries = getItem<any[]>(KEYS.ENTRIES, []);

    if (filters.mood) {
        entries = entries.filter(e => e.mood === filters.mood);
    }
    if (filters.startDate) {
        entries = entries.filter(e => e.date >= filters.startDate);
    }
    if (filters.endDate) {
        entries = entries.filter(e => e.date <= filters.endDate);
    }

    // Sort by date desc, time desc
    entries.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.time.localeCompare(a.time);
    });

    if (filters.offset) {
        entries = entries.slice(filters.offset);
    }
    if (filters.limit) {
        entries = entries.slice(0, filters.limit);
    }

    return entries;
}

export function webFetchEntry(id: number): any {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    return entry;
}

export function webFetchEntriesByDate(date: string): any[] {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    return entries.filter(e => e.date === date).sort((a, b) => b.time.localeCompare(a.time));
}

export function webSearchEntries(query: string): any[] {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    const q = query.toLowerCase();
    return entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.content && e.content.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
    ).sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.time.localeCompare(a.time);
    });
}

export function webCreateEntry(data: any): any {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    const nextId = getItem<number>(KEYS.NEXT_ENTRY_ID, 1);

    const now = new Date().toISOString();
    const newEntry = {
        id: nextId,
        date: data.date,
        time: data.time,
        mood: data.mood,
        title: data.title,
        content: data.content || '',
        tags: data.tags || [],
        location: data.location || '',
        images: data.images || [],
        created_at: now,
        updated_at: now
    };

    entries.push(newEntry);
    setItem(KEYS.ENTRIES, entries);
    setItem(KEYS.NEXT_ENTRY_ID, nextId + 1);

    return newEntry;
}

export function webUpdateEntry(id: number, data: any): any {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Entry not found');

    const updated = {
        ...entries[index],
        ...data,
        updated_at: new Date().toISOString()
    };
    entries[index] = updated;
    setItem(KEYS.ENTRIES, entries);

    return updated;
}

export function webDeleteEntry(id: number): void {
    let entries = getItem<any[]>(KEYS.ENTRIES, []);
    entries = entries.filter(e => e.id !== id);
    setItem(KEYS.ENTRIES, entries);
}

// ==================== Settings ====================

export function webFetchSettings(): any {
    return getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function webUpdateSettings(data: any): any {
    const settings = getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    const updated = { ...settings, ...data };
    setItem(KEYS.SETTINGS, updated);
    return updated;
}

// ==================== Profile ====================

export function webFetchProfile(): any {
    return getItem(KEYS.PROFILE, DEFAULT_PROFILE);
}

export function webUpdateProfile(data: any): any {
    const profile = getItem(KEYS.PROFILE, DEFAULT_PROFILE);
    const updated = { ...profile, ...data };
    setItem(KEYS.PROFILE, updated);
    return updated;
}

// ==================== Tags ====================

export function webFetchTags(): any {
    const tags = getItem<any[]>(KEYS.TAGS, DEFAULT_TAGS);
    return {
        positive: tags.filter(t => t.mood_type === 'positive'),
        neutral: tags.filter(t => t.mood_type === 'neutral'),
        negative: tags.filter(t => t.mood_type === 'negative')
    };
}

export function webFetchTagsByMood(moodType: string): any[] {
    const tags = getItem<any[]>(KEYS.TAGS, DEFAULT_TAGS);
    return tags.filter(t => t.mood_type === moodType);
}

export function webCreateTag(data: any): any {
    const tags = getItem<any[]>(KEYS.TAGS, DEFAULT_TAGS);
    const nextId = getItem<number>(KEYS.NEXT_TAG_ID, 10);

    const newTag = {
        id: nextId,
        name: data.name,
        mood_type: data.mood_type,
        is_default: false
    };

    tags.push(newTag);
    setItem(KEYS.TAGS, tags);
    setItem(KEYS.NEXT_TAG_ID, nextId + 1);

    return newTag;
}

export function webDeleteTag(id: number): void {
    let tags = getItem<any[]>(KEYS.TAGS, DEFAULT_TAGS);
    tags = tags.filter(t => t.id !== id);
    setItem(KEYS.TAGS, tags);
}

// ==================== Stats ====================

export function webFetchStats(): any {
    const entries = getItem<any[]>(KEYS.ENTRIES, []);
    const total = entries.length;

    // Mood distribution
    const positive = entries.filter(e => e.mood === 'positive').length;
    const neutral = entries.filter(e => e.mood === 'neutral').length;
    const negative = entries.filter(e => e.mood === 'negative').length;

    const distribution = {
        positive,
        neutral,
        negative,
        positive_percent: total > 0 ? Math.round((positive / total) * 100) : 0,
        neutral_percent: total > 0 ? Math.round((neutral / total) * 100) : 0,
        negative_percent: total > 0 ? Math.round((negative / total) * 100) : 0
    };

    // Weekly trend
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const weeklyTrend = dates.map(date => ({
        day: date,
        value: entries.filter(e => e.date === date).length
    }));

    // Streak
    let streak = 0;
    const uniqueDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    if (uniqueDates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            let expectedDate = new Date(uniqueDates[0]);

            for (let i = 1; i < uniqueDates.length; i++) {
                expectedDate.setDate(expectedDate.getDate() - 1);
                const expectedStr = expectedDate.toISOString().split('T')[0];
                if (uniqueDates[i] === expectedStr) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    return {
        total_entries: total,
        streak_days: streak,
        mood_distribution: distribution,
        weekly_trend: weeklyTrend
    };
}
