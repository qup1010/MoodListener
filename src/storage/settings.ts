import { getDBConnection } from './database';

export interface SettingsData {
    id: number;
    notification_enabled: boolean;
    notification_time: string;
    theme_id: string;
    dark_mode: boolean;
}

export interface UpdateSettingsData {
    notification_enabled?: boolean;
    notification_time?: string;
    theme_id?: string;
    dark_mode?: boolean;
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

// Settings
export async function fetchSettings(): Promise<SettingsData> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM settings WHERE id = 1');

    if (values && values.length > 0) {
        const row = values[0];
        return {
            id: row.id,
            notification_enabled: !!row.notification_enabled,
            notification_time: row.notification_time,
            theme_id: row.theme_id,
            dark_mode: !!row.dark_mode
        };
    }

    // 如果不存在（理论上不应该，因为 database.ts 里有初始化），返回默认值
    return {
        id: 1,
        notification_enabled: true,
        notification_time: "20:00",
        theme_id: "classic",
        dark_mode: false
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
    if (data.theme_id !== undefined) {
        setClauses.push('theme_id = ?');
        params.push(data.theme_id);
    }
    if (data.dark_mode !== undefined) {
        setClauses.push('dark_mode = ?');
        params.push(data.dark_mode ? 1 : 0);
    }

    if (setClauses.length > 0) {
        const sql = `UPDATE settings SET ${setClauses.join(', ')} WHERE id = 1`;
        await db.run(sql, params);
    }

    return fetchSettings();
}

// Profile
export async function fetchProfile(): Promise<UserProfile> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM user_profile WHERE id = 1');

    if (values && values.length > 0) {
        return values[0] as UserProfile;
    }

    return {
        id: 1,
        username: "朋友",
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
