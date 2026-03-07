/**
 * Web 端备用存储层
 * 在浏览器环境中使用 localStorage 模拟 SQLite 功能
 */

import { Capacitor } from '@capacitor/core';
import { ActivityGroupWithItems, MoodScore, RecordDraftV2 } from '../../types';
import { DEFAULT_ACTIVITY_GROUP_SEEDS, MOOD_SCORE_DEFAULT } from '../constants/moodV2';
import { toLocalDateString } from '../utils/date';

// 检测是否在原生环境中运行
export const isNativePlatform = () => {
    return Capacitor.isNativePlatform();
};

// 默认数据
const DEFAULT_SETTINGS = {
    id: 1,
    notification_enabled: true,
    notification_time: '20:00',
    reminders: [
        { id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }
    ],
    theme_id: "forest",
    dark_mode: false,
    dark_mode_option: 'system',
    amap_key: undefined,
    weekly_insight_cache: {},
    mood_icon_pack_id: 'playful'
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

const DEFAULT_RECORD_DRAFT_V2: RecordDraftV2 = {
    mood_score: MOOD_SCORE_DEFAULT,
    activity_ids: [],
    quick_note: '',
    full_note: '',
    location: '',
    images: [],
    audio_clips: []
};

const buildDefaultActivitySeeds = () => {
    const groups = DEFAULT_ACTIVITY_GROUP_SEEDS.map((seed, index) => ({
        id: index + 1,
        name: seed.name,
        sort_order: index,
        is_default: true
    }));

    let nextActivityId = 1;
    const activities = DEFAULT_ACTIVITY_GROUP_SEEDS.flatMap((seed, groupIndex) =>
        seed.activities.map((activity, activityIndex) => ({
            id: nextActivityId++,
            group_id: groupIndex + 1,
            name: activity.name,
            icon: activity.icon,
            sort_order: activityIndex,
            is_default: true,
            is_archived: false
        }))
    );

    return {
        groups,
        activities,
        nextGroupId: groups.length + 1,
        nextActivityId
    };
};

const DEFAULT_V2_SEEDS = buildDefaultActivitySeeds();
const MOJIBAKE_REPLACEMENT_CHAR = '\uFFFD';

const looksCorruptedText = (value?: string | null): boolean => {
    if (!value || typeof value !== 'string') return false;
    return value.includes(MOJIBAKE_REPLACEMENT_CHAR);
};

const normalizeWeeklyInsightCache = (cache: any) => {
    if (!cache || typeof cache !== 'object') return {};
    const raw = JSON.stringify(cache);
    return looksCorruptedText(raw) ? {} : cache;
};

const repairStoredGroups = (groups: any[]) => {
    let changed = false;
    const next = groups.map((group, index) => {
        if (!group?.is_default) return group;
        const seed = DEFAULT_ACTIVITY_GROUP_SEEDS[group.sort_order ?? index] || DEFAULT_ACTIVITY_GROUP_SEEDS[index];
        if (!seed || !looksCorruptedText(group.name)) return group;
        changed = true;
        return { ...group, name: seed.name };
    });
    return { changed, value: next };
};

const repairStoredActivities = (activities: any[], groups: any[]) => {
    let changed = false;
    const groupSeedById = new Map();
    groups.forEach((group, index) => {
        const seed = DEFAULT_ACTIVITY_GROUP_SEEDS[group.sort_order ?? index] || DEFAULT_ACTIVITY_GROUP_SEEDS[index];
        if (seed) groupSeedById.set(group.id, seed);
    });

    const next = activities.map((activity) => {
        if (!activity?.is_default) return activity;
        const groupSeed = groupSeedById.get(activity.group_id);
        const activitySeed = groupSeed?.activities?.[activity.sort_order ?? 0];
        if (!activitySeed || !looksCorruptedText(activity.name)) return activity;
        changed = true;
        return { ...activity, name: activitySeed.name, icon: activity.icon || activitySeed.icon };
    });

    return { changed, value: next };
};

const ensureDefaultActivities = (activities: any[], groups: any[]) => {
    let changed = false;
    let nextId = activities.reduce((max, activity) => Math.max(max, Number(activity?.id) || 0), 0) + 1;
    const nextActivities = [...activities];

    groups.forEach((group, index) => {
        if (!group?.is_default) return;

        const seed = DEFAULT_ACTIVITY_GROUP_SEEDS[group.sort_order ?? index] || DEFAULT_ACTIVITY_GROUP_SEEDS[index];
        if (!seed) return;

        const existingNames = new Set(
            nextActivities
                .filter((activity) => Number(activity.group_id) === Number(group.id) && activity.is_default)
                .map((activity) => activity.name)
        );

        seed.activities.forEach((activitySeed, activityIndex) => {
            if (existingNames.has(activitySeed.name)) return;
            changed = true;
            nextActivities.push({
                id: nextId++,
                group_id: group.id,
                name: activitySeed.name,
                icon: activitySeed.icon,
                sort_order: activityIndex,
                is_default: true,
                is_archived: false
            });
        });
    });

    if (changed) {
        nextActivities.sort((a, b) => {
            if (a.group_id !== b.group_id) return Number(a.group_id) - Number(b.group_id);
            if (a.sort_order !== b.sort_order) return Number(a.sort_order) - Number(b.sort_order);
            return Number(a.id) - Number(b.id);
        });
    }

    return { changed, value: nextActivities, nextId };
};

const repairPersistedTextData = () => {
    const groups = getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups);
    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
    const settings = getItem<any>(KEYS.SETTINGS, DEFAULT_SETTINGS);

    const repairedGroups = repairStoredGroups(groups);
    const repairedActivities = repairStoredActivities(activities, repairedGroups.value);
    const ensuredActivities = ensureDefaultActivities(repairedActivities.value, repairedGroups.value);
    const repairedCache = normalizeWeeklyInsightCache(settings?.weekly_insight_cache);

    if (repairedGroups.changed) setItem(KEYS.ACTIVITY_GROUPS, repairedGroups.value);
    if (repairedActivities.changed || ensuredActivities.changed) {
        setItem(KEYS.ACTIVITIES, ensuredActivities.value);
    }
    if (ensuredActivities.changed) {
        setItem(KEYS.NEXT_ACTIVITY_ID, ensuredActivities.nextId);
    }
    if (repairedCache !== settings?.weekly_insight_cache) {
        setItem(KEYS.SETTINGS, { ...settings, weekly_insight_cache: repairedCache });
    }
};


// Storage Keys
const KEYS = {
    ENTRIES: 'moodlistener_entries',
    SETTINGS: 'moodlistener_settings',
    PROFILE: 'moodlistener_profile',
    TAGS: 'moodlistener_tags',
    NEXT_ENTRY_ID: 'moodlistener_next_entry_id',
    NEXT_TAG_ID: 'moodlistener_next_tag_id',
    ENTRIES_V2: 'moodlistener_entries_v2',
    NEXT_ENTRY_V2_ID: 'moodlistener_next_entry_v2_id',
    ACTIVITY_GROUPS: 'moodlistener_activity_groups',
    ACTIVITIES: 'moodlistener_activities',
    NEXT_ACTIVITY_GROUP_ID: 'moodlistener_next_activity_group_id',
    NEXT_ACTIVITY_ID: 'moodlistener_next_activity_id',
    RECORD_DRAFT_V2: 'moodlistener_record_draft_v2'
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
    const sessionInit = sessionStorage.getItem('moodlistener_session_init');

    if (sessionInit === 'true') {
        repairPersistedTextData();
        return;
    }

    sessionStorage.setItem('moodlistener_session_init', 'true');

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

    if (!localStorage.getItem(KEYS.ACTIVITY_GROUPS)) {
        setItem(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups);
        setItem(KEYS.NEXT_ACTIVITY_GROUP_ID, DEFAULT_V2_SEEDS.nextGroupId);
    }
    if (!localStorage.getItem(KEYS.ACTIVITIES)) {
        setItem(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
        setItem(KEYS.NEXT_ACTIVITY_ID, DEFAULT_V2_SEEDS.nextActivityId);
    }
    if (!localStorage.getItem(KEYS.ENTRIES_V2)) {
        setItem(KEYS.ENTRIES_V2, []);
        setItem(KEYS.NEXT_ENTRY_V2_ID, 1);
    }
    if (!localStorage.getItem(KEYS.RECORD_DRAFT_V2)) {
        setItem(KEYS.RECORD_DRAFT_V2, DEFAULT_RECORD_DRAFT_V2);
    }

    repairPersistedTextData();

    const settings = getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    const option = settings.dark_mode_option === 'light' || settings.dark_mode_option === 'dark' || settings.dark_mode_option === 'system'
        ? settings.dark_mode_option
        : (settings.dark_mode ? 'dark' : 'light');

    if (!localStorage.getItem('darkMode')) {
        localStorage.setItem('darkMode', option);
    }
    if (settings.theme_id && !localStorage.getItem('themeId')) {
        localStorage.setItem('themeId', settings.theme_id);
    }
    if (settings.mood_icon_pack_id && !localStorage.getItem('mood_icon_pack_id')) {
        localStorage.setItem('mood_icon_pack_id', settings.mood_icon_pack_id);
    }

    localStorage.setItem('moodlistener_initialized', 'true');
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
    const entry = entries.find(e => e.id?.toString() === id.toString());
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
        id: nextId.toString(),
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
    const index = entries.findIndex(e => e.id?.toString() === id.toString());
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
    entries = entries.filter(e => e.id?.toString() !== id.toString());
    setItem(KEYS.ENTRIES, entries);
}

// ==================== Settings ====================

export function webFetchSettings(): any {
    const raw = getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
        ...DEFAULT_SETTINGS,
        ...raw,
        id: 1,
        reminders: Array.isArray(raw?.reminders) ? raw.reminders : DEFAULT_SETTINGS.reminders,
        weekly_insight_cache: raw?.weekly_insight_cache && typeof raw.weekly_insight_cache === 'object'
            ? normalizeWeeklyInsightCache(raw.weekly_insight_cache)
            : {},
        mood_icon_pack_id: raw?.mood_icon_pack_id || DEFAULT_SETTINGS.mood_icon_pack_id,
        app_lock_enabled: !!raw?.app_lock_enabled,
        app_lock_password_hash: raw?.app_lock_password_hash || null
    };
}

export function webUpdateSettings(data: any): any {
    const settings = webFetchSettings();
    const updated = {
        ...settings,
        ...data,
        id: 1,
        reminders: Array.isArray(data?.reminders) ? data.reminders : settings.reminders,
        weekly_insight_cache: data?.weekly_insight_cache && typeof data.weekly_insight_cache === 'object'
            ? data.weekly_insight_cache
            : settings.weekly_insight_cache,
        mood_icon_pack_id: data?.mood_icon_pack_id || settings.mood_icon_pack_id,
        app_lock_enabled: data?.app_lock_enabled !== undefined ? !!data.app_lock_enabled : !!settings.app_lock_enabled,
        app_lock_password_hash: data?.app_lock_password_hash !== undefined ? data.app_lock_password_hash : settings.app_lock_password_hash
    };
    setItem(KEYS.SETTINGS, updated);
    if (updated.theme_id) {
        localStorage.setItem('themeId', updated.theme_id);
    }
    if (updated.mood_icon_pack_id) {
        localStorage.setItem('mood_icon_pack_id', updated.mood_icon_pack_id);
    }
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
    tags = tags.filter(t => t.id?.toString() !== id.toString());
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
        dates.push(toLocalDateString(d));
    }

    const weeklyTrend = dates.map(date => ({
        day: date,
        value: entries.filter(e => e.date === date).length
    }));

    // Streak
    let streak = 0;
    const uniqueDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    if (uniqueDates.length > 0) {
        const today = toLocalDateString(new Date());
        const yesterday = toLocalDateString(new Date(Date.now() - 86400000));

        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            let expectedDate = new Date(uniqueDates[0]);

            for (let i = 1; i < uniqueDates.length; i++) {
                expectedDate.setDate(expectedDate.getDate() - 1);
                const expectedStr = toLocalDateString(expectedDate);
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





export interface WebBackupSnapshot {
    entries: any[];
    settings: any;
    profile: any;
    tags: any[];
}

export function webExportSnapshot(): WebBackupSnapshot {
    return {
        entries: getItem<any[]>(KEYS.ENTRIES, []),
        settings: getItem<any>(KEYS.SETTINGS, DEFAULT_SETTINGS),
        profile: getItem<any>(KEYS.PROFILE, DEFAULT_PROFILE),
        tags: getItem<any[]>(KEYS.TAGS, DEFAULT_TAGS)
    };
}

export function webImportSnapshot(snapshot: WebBackupSnapshot): void {
    const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
    const tags = Array.isArray(snapshot.tags) ? snapshot.tags : [];

    const settings = {
        ...DEFAULT_SETTINGS,
        ...(snapshot.settings || {}),
        id: 1,
        reminders: Array.isArray(snapshot.settings?.reminders) ? snapshot.settings.reminders : DEFAULT_SETTINGS.reminders,
        weekly_insight_cache: snapshot.settings?.weekly_insight_cache || {},
        mood_icon_pack_id: snapshot.settings?.mood_icon_pack_id || DEFAULT_SETTINGS.mood_icon_pack_id,
        app_lock_enabled: !!snapshot.settings?.app_lock_enabled,
        app_lock_password_hash: snapshot.settings?.app_lock_password_hash || null
    };

    const profile = {
        ...DEFAULT_PROFILE,
        ...(snapshot.profile || {}),
        id: 1
    };

    setItem(KEYS.ENTRIES, entries);
    setItem(KEYS.TAGS, tags);
    setItem(KEYS.SETTINGS, settings);
    setItem(KEYS.PROFILE, profile);

    const maxEntryId = entries.reduce((max, entry) => {
        const id = Number.parseInt(entry.id, 10);
        return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    const maxTagId = tags.reduce((max, tag) => {
        const id = Number.parseInt(tag.id, 10);
        return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    setItem(KEYS.NEXT_ENTRY_ID, maxEntryId + 1);
    setItem(KEYS.NEXT_TAG_ID, maxTagId + 1);

    const option = settings.dark_mode_option === 'light' || settings.dark_mode_option === 'dark' || settings.dark_mode_option === 'system'
        ? settings.dark_mode_option
        : (settings.dark_mode ? 'dark' : 'light');

    localStorage.setItem('darkMode', option);
    if (settings.theme_id) {
        localStorage.setItem('themeId', settings.theme_id);
    }
    if (settings.mood_icon_pack_id) {
        localStorage.setItem('mood_icon_pack_id', settings.mood_icon_pack_id);
    }
}







// ==================== V2 Activities ====================

export function webFetchActivityGroups(includeArchived = false): ActivityGroupWithItems[] {
    const groups = getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities)
        .filter((item) => includeArchived || !item.is_archived)
        .sort((a, b) => {
            if (a.group_id !== b.group_id) return a.group_id - b.group_id;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });

    return groups.map((group) => ({
        ...group,
        activities: activities.filter((item) => item.group_id === group.id)
    }));
}

export function webCreateActivityGroup(data: { name: string }): any {
    const groups = getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups);
    const nextId = getItem<number>(KEYS.NEXT_ACTIVITY_GROUP_ID, DEFAULT_V2_SEEDS.nextGroupId);

    const nextSortOrder = groups.length > 0
        ? Math.max(...groups.map((item) => Number(item.sort_order || 0))) + 1
        : 0;

    const created = {
        id: nextId,
        name: data.name,
        sort_order: nextSortOrder,
        is_default: false
    };

    groups.push(created);
    setItem(KEYS.ACTIVITY_GROUPS, groups);
    setItem(KEYS.NEXT_ACTIVITY_GROUP_ID, nextId + 1);

    return created;
}

export function webUpdateActivityGroup(id: number, data: { name?: string }): any {
    const groups = getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups);
    const index = groups.findIndex((group) => Number(group.id) === Number(id));
    if (index === -1) throw new Error('Group not found');

    groups[index] = {
        ...groups[index],
        ...data
    };

    setItem(KEYS.ACTIVITY_GROUPS, groups);
    return groups[index];
}

export function webReorderActivityGroups(groupIds: number[]): void {
    const groups = getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups);
    const orderMap = new Map<number, number>();

    groupIds.forEach((groupId, index) => {
        orderMap.set(Number(groupId), index);
    });

    const reordered = groups.map((group) => ({
        ...group,
        sort_order: orderMap.has(Number(group.id)) ? orderMap.get(Number(group.id)) : group.sort_order
    }));

    setItem(KEYS.ACTIVITY_GROUPS, reordered);
}

export function webCreateActivity(data: { group_id: number; name: string; icon?: string }): any {
    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
    const nextId = getItem<number>(KEYS.NEXT_ACTIVITY_ID, DEFAULT_V2_SEEDS.nextActivityId);

    const inGroup = activities.filter((item) => Number(item.group_id) === Number(data.group_id));
    const nextSortOrder = inGroup.length > 0
        ? Math.max(...inGroup.map((item) => Number(item.sort_order || 0))) + 1
        : 0;

    const created = {
        id: nextId,
        group_id: data.group_id,
        name: data.name,
        icon: data.icon || 'label',
        sort_order: nextSortOrder,
        is_default: false,
        is_archived: false
    };

    activities.push(created);
    setItem(KEYS.ACTIVITIES, activities);
    setItem(KEYS.NEXT_ACTIVITY_ID, nextId + 1);

    return created;
}

export function webUpdateActivity(id: number, data: { group_id?: number; name?: string; icon?: string }): any {
    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
    const index = activities.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) throw new Error('Activity not found');

    activities[index] = {
        ...activities[index],
        ...data
    };

    setItem(KEYS.ACTIVITIES, activities);
    return activities[index];
}

export function webMoveActivity(id: number, targetGroupId: number): any {
    return webUpdateActivity(id, { group_id: targetGroupId });
}

export function webArchiveActivity(id: number, archived = true): any {
    return webUpdateActivity(id, { is_archived: archived } as any);
}

export function webReorderActivities(groupId: number, activityIds: number[]): void {
    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
    const orderMap = new Map<number, number>();

    activityIds.forEach((activityId, index) => {
        orderMap.set(Number(activityId), index);
    });

    const updated = activities.map((item) => {
        if (orderMap.has(Number(item.id))) {
            return {
                ...item,
                group_id: groupId,
                sort_order: orderMap.get(Number(item.id))
            };
        }
        return item;
    });

    setItem(KEYS.ACTIVITIES, updated);
}

// ==================== V2 Entries ====================

const enrichEntryV2 = (entry: any): any => {
    const activities = getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities);
    const ids = Array.isArray(entry.activity_ids) ? entry.activity_ids : [];
    const selected = activities.filter((activity) => ids.includes(activity.id));

    return {
        ...entry,
        activity_ids: ids,
        activities: selected,
        images: Array.isArray(entry.images) ? entry.images : [],
        audio_clips: Array.isArray(entry.audio_clips) ? entry.audio_clips : []
    };
};

export function webFetchEntriesV2(filters: any = {}): any[] {
    let entries = getItem<any[]>(KEYS.ENTRIES_V2, []);

    if (filters.moodScore !== undefined) {
        entries = entries.filter((item) => Number(item.mood_score) === Number(filters.moodScore));
    }
    if (filters.startDate) {
        entries = entries.filter((item) => item.date >= filters.startDate);
    }
    if (filters.endDate) {
        entries = entries.filter((item) => item.date <= filters.endDate);
    }

    entries.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.time !== b.time) return b.time.localeCompare(a.time);
        return Number(b.id) - Number(a.id);
    });

    if (filters.offset) {
        entries = entries.slice(filters.offset);
    }
    if (filters.limit) {
        entries = entries.slice(0, filters.limit);
    }

    return entries.map(enrichEntryV2);
}

export function webFetchEntryV2(id: number): any {
    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []);
    const found = entries.find((item) => String(item.id) === String(id));
    if (!found) throw new Error('Entry not found');
    return enrichEntryV2(found);
}

export function webFetchEntriesV2ByDate(date: string): any[] {
    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []);
    return entries
        .filter((item) => item.date === date)
        .sort((a, b) => b.time.localeCompare(a.time))
        .map(enrichEntryV2);
}

export function webSearchEntriesV2(query: string): any[] {
    const q = query.trim().toLowerCase();
    if (!q) return webFetchEntriesV2();

    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []);

    return entries
        .map(enrichEntryV2)
        .filter((entry) => {
            const activityText = (entry.activities || []).map((item: any) => item.name).join(' ').toLowerCase();
            return (
                (entry.quick_note || '').toLowerCase().includes(q) ||
                (entry.full_note || '').toLowerCase().includes(q) ||
                (entry.location || '').toLowerCase().includes(q) ||
                activityText.includes(q)
            );
        })
        .sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            if (a.time !== b.time) return b.time.localeCompare(a.time);
            return Number(b.id) - Number(a.id);
        });
}

export function webCreateEntryV2(data: any): any {
    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []);
    const nextId = getItem<number>(KEYS.NEXT_ENTRY_V2_ID, 1);

    const now = new Date().toISOString();
    const created = {
        id: String(nextId),
        date: data.date,
        time: data.time,
        mood_score: Number(data.mood_score || MOOD_SCORE_DEFAULT),
        quick_note: data.quick_note || '',
        full_note: data.full_note || '',
        location: data.location || '',
        images: Array.isArray(data.images) ? data.images : [],
        audio_clips: Array.isArray(data.audio_clips) ? data.audio_clips : [],
        activity_ids: Array.isArray(data.activity_ids) ? data.activity_ids : [],
        created_at: now,
        updated_at: now
    };

    entries.push(created);
    setItem(KEYS.ENTRIES_V2, entries);
    setItem(KEYS.NEXT_ENTRY_V2_ID, nextId + 1);

    return enrichEntryV2(created);
}

export function webUpdateEntryV2(id: number, data: any): any {
    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []);
    const index = entries.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error('Entry not found');

    const updated = {
        ...entries[index],
        ...data,
        mood_score: data.mood_score !== undefined ? Number(data.mood_score) : entries[index].mood_score,
        activity_ids: data.activity_ids !== undefined ? (Array.isArray(data.activity_ids) ? data.activity_ids : []) : entries[index].activity_ids,
        images: data.images !== undefined ? (Array.isArray(data.images) ? data.images : []) : entries[index].images,
        audio_clips: data.audio_clips !== undefined ? (Array.isArray(data.audio_clips) ? data.audio_clips : []) : entries[index].audio_clips,
        updated_at: new Date().toISOString()
    };

    entries[index] = updated;
    setItem(KEYS.ENTRIES_V2, entries);

    return enrichEntryV2(updated);
}

export function webDeleteEntryV2(id: number): void {
    let entries = getItem<any[]>(KEYS.ENTRIES_V2, []);
    entries = entries.filter((item) => String(item.id) !== String(id));
    setItem(KEYS.ENTRIES_V2, entries);
}

// ==================== V2 Draft ====================

export function webGetRecordDraftV2(): RecordDraftV2 {
    const draft = getItem<RecordDraftV2>(KEYS.RECORD_DRAFT_V2, DEFAULT_RECORD_DRAFT_V2);

    return {
        mood_score: [1, 2, 3, 4, 5].includes(Number(draft.mood_score)) ? draft.mood_score : MOOD_SCORE_DEFAULT,
        activity_ids: Array.isArray(draft.activity_ids) ? draft.activity_ids : [],
        quick_note: draft.quick_note || '',
        full_note: draft.full_note || '',
        location: draft.location || '',
        images: Array.isArray(draft.images) ? draft.images : [],
        audio_clips: Array.isArray(draft.audio_clips) ? draft.audio_clips : []
    };
}

export function webSaveRecordDraftV2(draft: Partial<RecordDraftV2>): RecordDraftV2 {
    const current = webGetRecordDraftV2();
    const next = {
        ...current,
        ...draft,
        mood_score: draft.mood_score !== undefined ? draft.mood_score : current.mood_score,
        activity_ids: draft.activity_ids !== undefined ? draft.activity_ids : current.activity_ids,
        images: draft.images !== undefined ? draft.images : current.images,
        audio_clips: draft.audio_clips !== undefined ? draft.audio_clips : current.audio_clips
    };

    setItem(KEYS.RECORD_DRAFT_V2, next);
    return next;
}

export function webClearRecordDraftV2(): void {
    setItem(KEYS.RECORD_DRAFT_V2, DEFAULT_RECORD_DRAFT_V2);
}

// ==================== V2 Stats ====================

const buildRecentDates = (days: number): string[] => {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const next = new Date();
        next.setDate(next.getDate() - i);
        dates.push(toLocalDateString(next));
    }
    return dates;
};

const getMoodDistributionV2 = (entries: any[]) => {
    const total = entries.length;
    const countMap = new Map<number, number>([[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]);

    entries.forEach((entry) => {
        const score = Number(entry.mood_score || 0);
        if (countMap.has(score)) {
            countMap.set(score, (countMap.get(score) || 0) + 1);
        }
    });

    return [5, 4, 3, 2, 1].map((score) => {
        const count = countMap.get(score) || 0;
        return {
            score,
            count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });
};

const calcAverageMood = (entries: any[]): number => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + Number(entry.mood_score || 0), 0);
    return Number((total / entries.length).toFixed(2));
};

const calcStreakV2 = (entries: any[]): number => {
    const uniqueDates = [...new Set(entries.map((entry) => entry.date))].sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(new Date(Date.now() - 86400000));
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 1;
    let expectedDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
        expectedDate.setDate(expectedDate.getDate() - 1);
        const expected = toLocalDateString(expectedDate);
        if (uniqueDates[i] !== expected) {
            break;
        }
        streak += 1;
    }

    return streak;
};

const buildTrendV2 = (entries: any[], days: number) => {
    const recentDates = buildRecentDates(days);

    return recentDates.map((date) => {
        const dayEntries = entries.filter((entry) => entry.date === date);
        return {
            day: date,
            entryCount: dayEntries.length,
            avgMood: calcAverageMood(dayEntries)
        };
    });
};

export function webFetchStatsV2(): any {
    const entries = getItem<any[]>(KEYS.ENTRIES_V2, []).map(enrichEntryV2);
    const totalEntries = entries.length;

    const recent7Start = buildRecentDates(7)[0];
    const recent30Start = buildRecentDates(30)[0];

    const recent7 = entries.filter((entry) => entry.date >= recent7Start);
    const recent30 = entries.filter((entry) => entry.date >= recent30Start);

    const activityCounter = new Map<string, { activity_id: number; name: string; count: number }>();

    entries.forEach((entry) => {
        (entry.activities || []).forEach((activity: any) => {
            const key = String(activity.id);
            const existing = activityCounter.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                activityCounter.set(key, {
                    activity_id: activity.id,
                    name: activity.name,
                    count: 1
                });
            }
        });
    });

    const topActivities = [...activityCounter.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
            ...item,
            ratioPercent: totalEntries > 0 ? Math.round((item.count / totalEntries) * 100) : 0
        }));

    return {
        total_entries: totalEntries,
        streak_days: calcStreakV2(entries),
        average_mood_7d: calcAverageMood(recent7),
        average_mood_30d: calcAverageMood(recent30),
        mood_distribution: getMoodDistributionV2(entries),
        top_activities: topActivities,
        trend_7d: buildTrendV2(entries, 7),
        trend_30d: buildTrendV2(entries, 30)
    };
}

export interface WebBackupSnapshotV2 {
    entries_v2: any[];
    activity_groups: any[];
    activities: any[];
    settings: any;
    profile: any;
}

export function webExportSnapshotV2(): WebBackupSnapshotV2 {
    return {
        entries_v2: getItem<any[]>(KEYS.ENTRIES_V2, []),
        activity_groups: getItem<any[]>(KEYS.ACTIVITY_GROUPS, DEFAULT_V2_SEEDS.groups),
        activities: getItem<any[]>(KEYS.ACTIVITIES, DEFAULT_V2_SEEDS.activities),
        settings: getItem<any>(KEYS.SETTINGS, DEFAULT_SETTINGS),
        profile: getItem<any>(KEYS.PROFILE, DEFAULT_PROFILE)
    };
}

export function webImportSnapshotV2(snapshot: WebBackupSnapshotV2): void {
    const entriesV2 = Array.isArray(snapshot.entries_v2) ? snapshot.entries_v2 : [];
    const groups = Array.isArray(snapshot.activity_groups) ? snapshot.activity_groups : DEFAULT_V2_SEEDS.groups;
    const activities = Array.isArray(snapshot.activities) ? snapshot.activities : DEFAULT_V2_SEEDS.activities;

    const settings = {
        ...DEFAULT_SETTINGS,
        ...(snapshot.settings || {}),
        id: 1,
        reminders: Array.isArray(snapshot.settings?.reminders) ? snapshot.settings.reminders : DEFAULT_SETTINGS.reminders,
        weekly_insight_cache: snapshot.settings?.weekly_insight_cache || {},
        mood_icon_pack_id: snapshot.settings?.mood_icon_pack_id || DEFAULT_SETTINGS.mood_icon_pack_id,
        app_lock_enabled: !!snapshot.settings?.app_lock_enabled,
        app_lock_password_hash: snapshot.settings?.app_lock_password_hash || null
    };

    const profile = {
        ...DEFAULT_PROFILE,
        ...(snapshot.profile || {}),
        id: 1
    };

    setItem(KEYS.ENTRIES_V2, entriesV2);
    setItem(KEYS.ACTIVITY_GROUPS, groups);
    setItem(KEYS.ACTIVITIES, activities);
    setItem(KEYS.SETTINGS, settings);
    setItem(KEYS.PROFILE, profile);

    const maxEntryId = entriesV2.reduce((max, entry) => {
        const id = Number.parseInt(entry.id, 10);
        return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    const maxGroupId = groups.reduce((max, group) => {
        const id = Number.parseInt(group.id, 10);
        return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    const maxActivityId = activities.reduce((max, activity) => {
        const id = Number.parseInt(activity.id, 10);
        return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    setItem(KEYS.NEXT_ENTRY_V2_ID, maxEntryId + 1);
    setItem(KEYS.NEXT_ACTIVITY_GROUP_ID, maxGroupId + 1);
    setItem(KEYS.NEXT_ACTIVITY_ID, maxActivityId + 1);
    setItem(KEYS.RECORD_DRAFT_V2, DEFAULT_RECORD_DRAFT_V2);

    const option = settings.dark_mode_option === 'light' || settings.dark_mode_option === 'dark' || settings.dark_mode_option === 'system'
        ? settings.dark_mode_option
        : (settings.dark_mode ? 'dark' : 'light');

    localStorage.setItem('darkMode', option);
    if (settings.theme_id) {
        localStorage.setItem('themeId', settings.theme_id);
    }
    if (settings.mood_icon_pack_id) {
        localStorage.setItem('mood_icon_pack_id', settings.mood_icon_pack_id);
    }
}

