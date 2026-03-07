import { getDBConnection } from './database';

export interface Reminder {
    id: string;
    time: string;
    enabled: boolean;
    days: number[];
}

export interface SettingsData {
    id: number;
    notification_enabled: boolean;
    notification_time: string;
    reminders: Reminder[];
    theme_id: string;
    dark_mode: boolean;
    dark_mode_option: 'light' | 'dark' | 'system';
    amap_key?: string;
    weekly_insight_cache: Record<string, any>;
    mood_icon_pack_id: import('../constants/moodV2').MoodIconPackId;
}

export interface UpdateSettingsData {
    notification_enabled?: boolean;
    notification_time?: string;
    reminders?: Reminder[];
    theme_id?: string;
    dark_mode?: boolean;
    dark_mode_option?: 'light' | 'dark' | 'system';
    amap_key?: string;
    weekly_insight_cache?: Record<string, any>;
    mood_icon_pack_id?: import('../constants/moodV2').MoodIconPackId;
}

export interface UserProfile {
    id: number;
    username: string;
    avatar_url?: string;
}

export interface UpdateProfileData {
    username?: string;
    avatar_url?: string;
}

export async function fetchSettings(): Promise<SettingsData> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM settings WHERE id = 1');

    if (values && values.length > 0) {
        const row = values[0];
        let reminders: Reminder[] = [];
        let weeklyInsightCache: Record<string, any> = {};

        if (row.reminders) {
            try {
                reminders = JSON.parse(row.reminders);
            } catch (e) {
                console.error('Failed to parse reminders:', e);
            }
        }

        if (row.weekly_insight_cache) {
            try {
                const parsed = JSON.parse(row.weekly_insight_cache);
                if (parsed && typeof parsed === 'object') {
                    weeklyInsightCache = parsed;
                }
            } catch (e) {
                console.error('Failed to parse weekly insight cache:', e);
            }
        }

        if (reminders.length === 0 && row.notification_time) {
            reminders = [{
                id: '1',
                time: row.notification_time,
                enabled: !!row.notification_enabled,
                days: [1, 2, 3, 4, 5, 6, 7]
            }];
        }

        const darkModeOption = row.dark_mode_option === 'light' || row.dark_mode_option === 'dark' || row.dark_mode_option === 'system'
            ? row.dark_mode_option
            : (!!row.dark_mode ? 'dark' : 'light');

        return {
            id: row.id,
            notification_enabled: !!row.notification_enabled,
            notification_time: row.notification_time,
            reminders,
            theme_id: row.theme_id,
            dark_mode: !!row.dark_mode,
            dark_mode_option: darkModeOption,
            amap_key: row.amap_key,
            weekly_insight_cache: weeklyInsightCache,
            mood_icon_pack_id: row.mood_icon_pack_id || 'playful'
        };
    }

    return {
        id: 1,
        notification_enabled: true,
        notification_time: '20:00',
        reminders: [{ id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }],
        theme_id: 'forest',
        dark_mode: false,
        dark_mode_option: 'system',
        weekly_insight_cache: {},
        mood_icon_pack_id: 'playful'
    };
}

export async function updateSettings(data: UpdateSettingsData): Promise<SettingsData> {
    const db = await getDBConnection();
    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.notification_enabled !== undefined) {
        setClauses.push('notification_enabled = ?');
        params.push(data.notification_enabled ? 1 : 0);
    }
    if (data.notification_time !== undefined) {
        setClauses.push('notification_time = ?');
        params.push(data.notification_time);
    }
    if (data.reminders !== undefined) {
        setClauses.push('reminders = ?');
        params.push(JSON.stringify(data.reminders));
    }
    if (data.theme_id !== undefined) {
        setClauses.push('theme_id = ?');
        params.push(data.theme_id);
    }
    if (data.dark_mode !== undefined) {
        setClauses.push('dark_mode = ?');
        params.push(data.dark_mode ? 1 : 0);
    }
    if (data.dark_mode_option !== undefined) {
        setClauses.push('dark_mode_option = ?');
        params.push(data.dark_mode_option);
    }
    if (data.amap_key !== undefined) {
        setClauses.push('amap_key = ?');
        params.push(data.amap_key);
    }
    if (data.weekly_insight_cache !== undefined) {
        setClauses.push('weekly_insight_cache = ?');
        params.push(JSON.stringify(data.weekly_insight_cache));
    }
    if (data.mood_icon_pack_id !== undefined) {
        setClauses.push('mood_icon_pack_id = ?');
        params.push(data.mood_icon_pack_id);
    }

    if (setClauses.length > 0) {
        const sql = `UPDATE settings SET ${setClauses.join(', ')} WHERE id = 1`;
        await db.run(sql, params);
    }

    return fetchSettings();
}

export async function fetchProfile(): Promise<UserProfile> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM user_profile WHERE id = 1');

    if (values && values.length > 0) {
        return values[0] as UserProfile;
    }

    return {
        id: 1,
        username: '朋友',
        avatar_url: undefined
    };
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const db = await getDBConnection();
    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.username !== undefined) {
        setClauses.push('username = ?');
        params.push(data.username);
    }
    if (data.avatar_url !== undefined) {
        setClauses.push('avatar_url = ?');
        params.push(data.avatar_url);
    }

    if (setClauses.length > 0) {
        const sql = `UPDATE user_profile SET ${setClauses.join(', ')} WHERE id = 1`;
        await db.run(sql, params);
    }

    return fetchProfile();
}

