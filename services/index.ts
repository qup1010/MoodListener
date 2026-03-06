/**
 * API 服务层封装 - 本地离线版
 * 自动检测运行环境，在 Web 使用 localStorage，在原生使用 SQLite
 */

import { Entry, MoodType, EntryV2, MoodScore, ActivityGroupWithItems, ActivityItem, RecentActivityItem, RecordDraftV2 } from '../types';
import { Capacitor } from '@capacitor/core';
import * as webStorage from '../src/storage/webStorage';
import { showToast } from '../src/ui/feedback';
import { toLocalDateString } from '../src/utils/date';

// 检测是否在原生环境
const isNative = Capacitor.isNativePlatform();

// NOTE: initWebStorage 已在 index.tsx 中调用，此处不需要重复调用

// 动态导入原生存储模块（仅在原生环境使用）
let entriesStorage: any = null;
let statsStorage: any = null;
let settingsStorage: any = null;
let tagsStorage: any = null;
let filesStorage: any = null;
let entriesStorageV2: any = null;
let statsStorageV2: any = null;
let activitiesStorage: any = null;

let nativeStorageReady: Promise<void> | null = null;

const ensureNativeStorageReady = async () => {
    if (!isNative) return;

    if (!nativeStorageReady) {
        nativeStorageReady = Promise.all([
            import('../src/storage/entries'),
            import('../src/storage/stats'),
            import('../src/storage/settings'),
            import('../src/storage/tags'),
            import('../src/storage/files'),
            import('../src/storage/entriesV2'),
            import('../src/storage/statsV2'),
            import('../src/storage/activities')
        ]).then(([entriesModule, statsModule, settingsModule, tagsModule, filesModule, entriesV2Module, statsV2Module, activitiesModule]) => {
            entriesStorage = entriesModule;
            statsStorage = statsModule;
            settingsStorage = settingsModule;
            tagsStorage = tagsModule;
            filesStorage = filesModule;
            entriesStorageV2 = entriesV2Module;
            statsStorageV2 = statsV2Module;
            activitiesStorage = activitiesModule;
        });
    }

    await nativeStorageReady;
};

export interface CreateEntryData {
    date: string;
    time: string;
    mood: MoodType;
    title: string;
    content?: string;
    tags?: string[];
    location?: string;
    images?: string[];
}

export interface UpdateEntryData {
    date?: string;
    time?: string;
    mood?: MoodType;
    title?: string;
    content?: string;
    tags?: string[];
    location?: string;
    images?: string[];
}

export interface EntryFilters {
    mood?: MoodType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface MoodDistribution {
    positive: number;
    neutral: number;
    negative: number;
    positive_percent: number;
    neutral_percent: number;
    negative_percent: number;
}

export interface WeeklyTrend {
    day: string;
    value: number;
}

export interface StatsData {
    total_entries: number;
    streak_days: number;
    mood_distribution: MoodDistribution;
    weekly_trend: WeeklyTrend[];
}

export interface Reminder {
    id: string;
    time: string;
    enabled: boolean;
    days: number[]; // 1-7 (Mon-Sun)
}

export interface SettingsData {
    id: number;
    notification_enabled: boolean; // Keep for backward compatibility or master switch
    notification_time?: string;
    reminders: Reminder[];
    theme_id: string;
    dark_mode: boolean;
    dark_mode_option?: 'light' | 'dark' | 'system';
    amap_key?: string;
    weekly_insight_cache?: Record<string, WeeklyInsight>;
}

export interface UpdateSettingsData {
    notification_enabled?: boolean;
    notification_time?: string;
    reminders?: Reminder[];
    theme_id?: string;
    dark_mode?: boolean;
    dark_mode_option?: 'light' | 'dark' | 'system';
    amap_key?: string;
    weekly_insight_cache?: Record<string, WeeklyInsight>;
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

export interface Tag {
    id: number;
    name: string;
    mood_type: MoodType;
    is_default: boolean;
}

export interface TagsByMood {
    positive: Tag[];
    neutral: Tag[];
    negative: Tag[];
}

export interface CreateTagData {
    name: string;
    mood_type: MoodType;
}

export interface UploadResult {
    filename: string;
    url: string;
}

// ==================== Entry API ====================

export async function fetchEntries(filters: EntryFilters = {}): Promise<Entry[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.fetchEntries(filters);
    }
    return webStorage.webFetchEntries(filters);
}

export async function fetchEntry(id: number): Promise<Entry> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.fetchEntry(id);
    }
    return webStorage.webFetchEntry(id);
}

export async function fetchEntriesByDate(date: string): Promise<Entry[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.fetchEntriesByDate(date);
    }
    return webStorage.webFetchEntriesByDate(date);
}

export async function searchEntries(query: string): Promise<Entry[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.searchEntries(query);
    }
    return webStorage.webSearchEntries(query);
}

export async function createEntry(data: CreateEntryData): Promise<Entry> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.createEntry(data);
    }
    return webStorage.webCreateEntry(data);
}

export async function updateEntry(id: number, data: UpdateEntryData): Promise<Entry> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.updateEntry(id, data);
    }
    return webStorage.webUpdateEntry(id, data);
}

export async function deleteEntry(id: number): Promise<void> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorage.deleteEntry(id);
    }
    return webStorage.webDeleteEntry(id);
}

// ==================== Stats API ====================

export async function fetchStats(): Promise<StatsData> {
    if (isNative) {
        await ensureNativeStorageReady();
        return statsStorage.fetchStats();
    }
    return webStorage.webFetchStats();
}

// ==================== Settings API ====================

export async function fetchSettings(): Promise<SettingsData> {
    if (isNative) {
        await ensureNativeStorageReady();
        return settingsStorage.fetchSettings();
    }
    return webStorage.webFetchSettings();
}

export async function updateSettings(data: UpdateSettingsData): Promise<SettingsData> {
    if (isNative) {
        await ensureNativeStorageReady();
        return settingsStorage.updateSettings(data);
    }
    return webStorage.webUpdateSettings(data);
}

// ==================== Export API ====================


type ExportFormat = 'csv' | 'json' | 'txt';

const sanitizeForCsv = (value: string): string => {
    const normalized = value.replace(/\r?\n|\r/g, ' ');
    const escaped = normalized.replace(/"/g, '""');
    const trimmed = escaped.trimStart();
    const dangerous = ['=', '+', '-', '@'];
    return dangerous.some(prefix => trimmed.startsWith(prefix)) ? `'${escaped}` : escaped;
};

export async function exportData(format: ExportFormat): Promise<void> {
    const entries = await fetchEntriesV2();
    let content = '';

    if (format === 'json') {
        content = JSON.stringify(entries, null, 2);
    } else if (format === 'csv') {
        content = 'Date,Time,MoodScore,QuickNote,FullNote,Activities,Location\n' +
            entries
                .map((entry) => {
                    const activities = (entry.activities || []).map((item) => item.name).join('|');
                    return `${sanitizeForCsv(entry.date)},${sanitizeForCsv(entry.time)},${entry.mood_score},"${sanitizeForCsv(entry.quick_note || '')}","${sanitizeForCsv(entry.full_note || '')}","${sanitizeForCsv(activities)}","${sanitizeForCsv(entry.location || '')}"`;
                })
                .join('\n');
    } else {
        content = entries
            .map((entry) => {
                const activities = (entry.activities || []).map((item) => item.name).join('、');
                return `[${entry.date} ${entry.time}] 情绪:${entry.mood_score}\n活动:${activities || '无'}\n快速笔记:${entry.quick_note || ''}\n完整注释:${entry.full_note || ''}`;
            })
            .join('\n\n');
    }

    if (isNative) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const filename = `moodlistener_export_v2_${Date.now()}.${format}`;
        await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });
        showToast(`已导出到文档目录: ${filename}`, 'success', 3000);
    } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moodlistener_export_v2.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ==================== Profile API ====================

export async function fetchProfile(): Promise<UserProfile> {
    if (isNative) {
        await ensureNativeStorageReady();
        return settingsStorage.fetchProfile();
    }
    return webStorage.webFetchProfile();
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    if (isNative) {
        await ensureNativeStorageReady();
        return settingsStorage.updateProfile(data);
    }
    return webStorage.webUpdateProfile(data);
}

// ==================== Tags API ====================

export async function fetchTags(): Promise<TagsByMood> {
    if (isNative) {
        await ensureNativeStorageReady();
        return tagsStorage.fetchTags();
    }
    return webStorage.webFetchTags();
}

export async function fetchTagsByMood(moodType: MoodType): Promise<Tag[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return tagsStorage.fetchTagsByMood(moodType);
    }
    return webStorage.webFetchTagsByMood(moodType);
}

export async function createTag(data: CreateTagData): Promise<Tag> {
    if (isNative) {
        await ensureNativeStorageReady();
        return tagsStorage.createTag(data);
    }
    return webStorage.webCreateTag(data);
}

export async function deleteTag(id: number): Promise<void> {
    if (isNative) {
        await ensureNativeStorageReady();
        return tagsStorage.deleteTag(id);
    }
    return webStorage.webDeleteTag(id);
}

// ==================== Upload API ====================

/**
 * 压缩图片
 */
async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // 按比例缩放
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('无法创建 canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

export async function uploadImage(file: File): Promise<UploadResult> {
    if (isNative) {
        await ensureNativeStorageReady();
        return filesStorage.saveImage(file);
    }
    // Web: 压缩图片后使用 Data URL
    try {
        const compressedUrl = await compressImage(file);
        return {
            filename: file.name,
            url: compressedUrl
        };
    } catch (error) {
        throw new Error('图片处理失败');
    }
}





export interface BackupCryptoMeta {
    kdf: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    cipher: 'AES-256-GCM';
    salt: string;
    iv: string;
}

export interface BackupEnvelope {
    version: number;
    createdAt: string;
    appVersion: string;
    crypto: BackupCryptoMeta;
    payload: string;
}

export interface ImportResult {
    success: true;
    restoredAt: string;
    entries: number;
    tags: number;
}

export interface MoodTrendDelta {
    mood: MoodType;
    currentPercent: number;
    previousPercent: number;
    deltaPercent: number;
}

export interface TagTriggerStat {
    tag: string;
    count: number;
    ratioPercent: number;
}

export interface WeeklyInsight {
    weekStart: string;
    weekEnd: string;
    generatedAt: string;
    recordCount: number;
    moodTrend: MoodTrendDelta[];
    topTags: TagTriggerStat[];
    suggestion: string;
}

export interface StatsDisplayState {
    hasEnoughData: boolean;
    unlockHint: string;
    showHealthScore: boolean;
    healthExplanation: string;
}

interface BackupPayload {
    entries: Entry[];
    settings: SettingsData;
    profile: UserProfile;
    tags: Tag[];
}

const BACKUP_VERSION = 1;
const APP_VERSION = '1.1.0';
const PBKDF2_ITERATIONS = 180000;

const ensurePassphrase = (passphrase: string) => {
    if (!passphrase || passphrase.trim().length < 4) {
        throw new Error('口令至少需要 4 个字符');
    }
};

const toUint8Array = (source: ArrayBuffer | Uint8Array): Uint8Array => {
    return source instanceof Uint8Array ? source : new Uint8Array(source);
};

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const addDays = (date: Date, deltaDays: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + deltaDays);
    return next;
};

const parseYmd = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const normalizeWeekStart = (input?: string): string => {
    if (input) {
        const parsed = parseYmd(input);
        if (!parsed) throw new Error('weekStart 必须是 YYYY-MM-DD 格式');
        return toLocalDateString(parsed);
    }

    const yesterday = addDays(new Date(), -1);
    const start = addDays(yesterday, -6);
    return toLocalDateString(start);
};

const getWeekEnd = (weekStart: string): string => {
    const start = parseYmd(weekStart);
    if (!start) throw new Error('无效的 weekStart');
    return toLocalDateString(addDays(start, 6));
};

const deriveAesKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations: PBKDF2_ITERATIONS
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

const flattenTagsByMood = (tagsByMood: TagsByMood): Tag[] => {
    return [...tagsByMood.positive, ...tagsByMood.neutral, ...tagsByMood.negative]
        .sort((a, b) => a.id - b.id);
};

const normalizeSnapshot = (input: Partial<BackupPayload>): BackupPayload => {
    const entries = Array.isArray(input.entries)
        ? input.entries.map((entry: any) => ({
            id: entry.id?.toString() || Date.now().toString(),
            date: entry.date,
            time: entry.time,
            mood: entry.mood,
            title: entry.title || '未命名记录',
            content: entry.content || '',
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            location: entry.location || '',
            images: Array.isArray(entry.images) ? entry.images : [],
            created_at: entry.created_at,
            updated_at: entry.updated_at
        }))
        : [];

    const tags = Array.isArray(input.tags)
        ? input.tags.map((tag: any, index: number) => ({
            id: Number.isFinite(Number(tag.id)) ? Number(tag.id) : index + 1,
            name: String(tag.name || '未命名标签'),
            mood_type: tag.mood_type === 'positive' || tag.mood_type === 'neutral' || tag.mood_type === 'negative'
                ? tag.mood_type
                : 'neutral',
            is_default: !!tag.is_default
        }))
        : [];

    const settings = {
        id: 1,
        notification_enabled: input.settings?.notification_enabled ?? true,
        notification_time: input.settings?.notification_time || '20:00',
        reminders: Array.isArray(input.settings?.reminders) ? input.settings!.reminders : [
            { id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }
        ],
        theme_id: input.settings?.theme_id || 'forest',
        dark_mode: !!input.settings?.dark_mode,
        dark_mode_option: input.settings?.dark_mode_option === 'light' || input.settings?.dark_mode_option === 'dark' || input.settings?.dark_mode_option === 'system'
            ? input.settings.dark_mode_option
            : 'system',
        amap_key: input.settings?.amap_key,
        weekly_insight_cache: input.settings?.weekly_insight_cache && typeof input.settings.weekly_insight_cache === 'object'
            ? input.settings.weekly_insight_cache
            : {}
    } as SettingsData;

    const profile = {
        id: 1,
        username: input.profile?.username || '朋友',
        avatar_url: input.profile?.avatar_url
    } as UserProfile;

    return {
        entries,
        settings,
        profile,
        tags
    };
};

const collectBackupPayload = async (): Promise<BackupPayload> => {
    if (isNative) {
        await ensureNativeStorageReady();

        const [entries, settings, profile, tagsByMood] = await Promise.all([
            entriesStorage.fetchEntries(),
            settingsStorage.fetchSettings(),
            settingsStorage.fetchProfile(),
            tagsStorage.fetchTags()
        ]);

        return normalizeSnapshot({
            entries,
            settings,
            profile,
            tags: flattenTagsByMood(tagsByMood)
        });
    }

    return normalizeSnapshot(webStorage.webExportSnapshot());
};

const persistImportedPayloadNative = async (payload: BackupPayload): Promise<void> => {
    const { getDBConnection } = await import('../src/storage/database');
    const db = await getDBConnection();

    const entries = payload.entries;
    const tags = payload.tags;
    const settings = payload.settings;
    const profile = payload.profile;

    await db.execute('BEGIN TRANSACTION');

    try {
        await db.run('DELETE FROM entries');
        await db.run('DELETE FROM tags');

        for (const tag of tags) {
            await db.run(
                'INSERT INTO tags (id, name, mood_type, is_default) VALUES (?, ?, ?, ?)',
                [tag.id, tag.name, tag.mood_type, tag.is_default ? 1 : 0]
            );
        }

        for (const entry of entries) {
            const entryId = Number.parseInt(entry.id, 10);
            if (!Number.isFinite(entryId)) continue;

            await db.run(
                `INSERT INTO entries (id, date, time, mood, title, content, tags, location, images, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    entryId,
                    entry.date,
                    entry.time,
                    entry.mood,
                    entry.title,
                    entry.content || '',
                    JSON.stringify(entry.tags || []),
                    entry.location || '',
                    JSON.stringify(entry.images || []),
                    entry.created_at || new Date().toISOString(),
                    entry.updated_at || new Date().toISOString()
                ]
            );
        }

        await db.run(
            `UPDATE settings
             SET notification_enabled = ?,
                 notification_time = ?,
                 reminders = ?,
                 theme_id = ?,
                 dark_mode = ?,
                 dark_mode_option = ?,
                 amap_key = ?,
                 weekly_insight_cache = ?
             WHERE id = 1`,
            [
                settings.notification_enabled ? 1 : 0,
                settings.notification_time || '20:00',
                JSON.stringify(settings.reminders || []),
                settings.theme_id || 'forest',
                settings.dark_mode ? 1 : 0,
                settings.dark_mode_option || 'system',
                settings.amap_key || null,
                JSON.stringify(settings.weekly_insight_cache || {})
            ]
        );

        await db.run('UPDATE user_profile SET username = ?, avatar_url = ? WHERE id = 1', [
            profile.username || '朋友',
            profile.avatar_url || null
        ]);

        try {
            await db.run("DELETE FROM sqlite_sequence WHERE name IN ('entries', 'tags')");

            const maxEntryId = entries.reduce((max, entry) => {
                const entryId = Number.parseInt(entry.id, 10);
                return Number.isFinite(entryId) ? Math.max(max, entryId) : max;
            }, 0);

            const maxTagId = tags.reduce((max, tag) => Math.max(max, tag.id), 0);

            if (maxEntryId > 0) {
                await db.run("INSERT INTO sqlite_sequence (name, seq) VALUES ('entries', ?)", [maxEntryId]);
            }

            if (maxTagId > 0) {
                await db.run("INSERT INTO sqlite_sequence (name, seq) VALUES ('tags', ?)", [maxTagId]);
            }
        } catch (sequenceError) {
            console.warn('Failed to reset sqlite sequence:', sequenceError);
        }

        await db.execute('COMMIT');
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
};

const persistImportedPayload = async (payload: BackupPayload): Promise<void> => {
    if (isNative) {
        await persistImportedPayloadNative(payload);
        return;
    }

    webStorage.webImportSnapshot(payload);
};

const readBackupText = async (file: File | Blob | string): Promise<string> => {
    if (typeof file === 'string') {
        const { Filesystem, Encoding } = await import('@capacitor/filesystem');
        const result = await Filesystem.readFile({ path: file, encoding: Encoding.UTF8 });
        return result.data as string;
    }

    return file.text();
};

const parseBackupEnvelope = (rawText: string): BackupEnvelope => {
    let parsed: BackupEnvelope;

    try {
        parsed = JSON.parse(rawText) as BackupEnvelope;
    } catch {
        throw new Error('备份文件格式错误，无法解析');
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('备份文件格式错误');
    }

    if (parsed.version !== BACKUP_VERSION) {
        throw new Error(`不支持的备份版本: ${parsed.version}`);
    }

    if (!parsed.crypto || !parsed.payload) {
        throw new Error('备份文件缺少必要字段');
    }

    return parsed;
};

const decryptPayload = async (envelope: BackupEnvelope, passphrase: string): Promise<BackupPayload> => {
    try {
        const salt = base64ToBytes(envelope.crypto.salt);
        const iv = base64ToBytes(envelope.crypto.iv);
        const cipherBytes = base64ToBytes(envelope.payload);

        const key = await deriveAesKey(passphrase, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            cipherBytes
        );

        const plaintext = new TextDecoder().decode(decrypted);
        const payload = JSON.parse(plaintext) as Partial<BackupPayload>;

        return normalizeSnapshot(payload);
    } catch (error) {
        throw new Error('口令错误或备份已损坏，导入已中止');
    }
};

export async function exportEncryptedBackup(passphrase: string): Promise<File | string> {
    ensurePassphrase(passphrase);

    const payload = await collectBackupPayload();
    const payloadText = JSON.stringify(payload);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveAesKey(passphrase, salt);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(payloadText)
    );

    const envelope: BackupEnvelope = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        crypto: {
            kdf: 'PBKDF2',
            hash: 'SHA-256',
            iterations: PBKDF2_ITERATIONS,
            cipher: 'AES-256-GCM',
            salt: bytesToBase64(salt),
            iv: bytesToBase64(iv)
        },
        payload: bytesToBase64(toUint8Array(encrypted))
    };

    const backupText = JSON.stringify(envelope, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `moodlistener-backup-v${BACKUP_VERSION}-${timestamp}.mlbk`;

    if (isNative) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const result = await Filesystem.writeFile({
            path: filename,
            data: backupText,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
            recursive: true
        });
        return result.uri || filename;
    }

    return new File([backupText], filename, { type: 'application/json' });
}

export async function importEncryptedBackup(file: File | Blob | string, passphrase: string): Promise<ImportResult> {
    ensurePassphrase(passphrase);

    const backupText = await readBackupText(file);
    const envelope = parseBackupEnvelope(backupText);
    const payload = await decryptPayload(envelope, passphrase);

    await persistImportedPayload(payload);

    return {
        success: true,
        restoredAt: new Date().toISOString(),
        entries: payload.entries.length,
        tags: payload.tags.length
    };
}

const pickTopTags = (entries: Entry[], limit = 3): TagTriggerStat[] => {
    const total = entries.length;
    const counter = new Map<string, number>();

    for (const entry of entries) {
        for (const tag of entry.tags || []) {
            const normalized = String(tag || '').trim();
            if (!normalized) continue;
            counter.set(normalized, (counter.get(normalized) || 0) + 1);
        }
    }

    return [...counter.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({
            tag,
            count,
            ratioPercent: total > 0 ? Math.round((count / total) * 100) : 0
        }));
};

const buildSuggestion = (recordCount: number, moodTrend: MoodTrendDelta[], topTags: TagTriggerStat[]): string => {
    const positiveDelta = moodTrend.find(item => item.mood === 'positive')?.deltaPercent || 0;
    const negativeDelta = moodTrend.find(item => item.mood === 'negative')?.deltaPercent || 0;
    const topTag = topTags[0]?.tag || '';

    if (recordCount === 0) {
        return '最近 7 天还没有记录，先从今天的一句话开始。';
    }

    if (negativeDelta >= 12) {
        return '本周负面情绪占比上升，建议每天花 5 分钟记录触发事件和应对方式。';
    }

    if (positiveDelta >= 12) {
        return '本周积极情绪在提升，继续保持让你状态变好的习惯。';
    }

    if (topTag.includes('焦虑') || topTag.includes('压力') || topTag.includes('失眠')) {
        return `本周高频触发是“${topTag}”，可以尝试固定一个晚间放松流程来缓冲压力。`;
    }

    if (recordCount >= 7) {
        return '记录节奏很稳定，建议继续保持每天一次短记录，优先写下触发原因。';
    }

    return '这周的记录还在积累，先保持频率，再观察情绪和标签变化。';
};

const buildMoodTrend = (currentEntries: Entry[], previousEntries: Entry[]): MoodTrendDelta[] => {
    const moods: MoodType[] = ['positive', 'neutral', 'negative'];
    const currentTotal = currentEntries.length;
    const previousTotal = previousEntries.length;

    const countByMood = (entries: Entry[], mood: MoodType) => entries.filter(entry => entry.mood === mood).length;

    return moods.map((mood) => {
        const currentCount = countByMood(currentEntries, mood);
        const previousCount = countByMood(previousEntries, mood);

        const currentPercent = currentTotal > 0 ? Math.round((currentCount / currentTotal) * 100) : 0;
        const previousPercent = previousTotal > 0 ? Math.round((previousCount / previousTotal) * 100) : 0;

        return {
            mood,
            currentPercent,
            previousPercent,
            deltaPercent: currentPercent - previousPercent
        };
    });
};

const getSettingsInsightCache = (settings: SettingsData): Record<string, WeeklyInsight> => {
    const raw = settings.weekly_insight_cache;
    if (raw && typeof raw === 'object') {
        return raw;
    }
    return {};
};

const keepRecentInsightCache = (cache: Record<string, WeeklyInsight>, maxWeeks = 16): Record<string, WeeklyInsight> => {
    const sortedKeys = Object.keys(cache).sort((a, b) => b.localeCompare(a));
    const limited = sortedKeys.slice(0, maxWeeks);
    const result: Record<string, WeeklyInsight> = {};

    for (const key of limited) {
        result[key] = cache[key];
    }

    return result;
};

const computeWeeklyInsight = async (weekStartInput?: string): Promise<WeeklyInsight> => {
    const weekStart = normalizeWeekStart(weekStartInput);
    const weekEnd = getWeekEnd(weekStart);

    const previousEndDate = addDays(parseYmd(weekStart)!, -1);
    const previousStart = toLocalDateString(addDays(previousEndDate, -6));
    const previousEnd = toLocalDateString(previousEndDate);

    const entries = await fetchEntries();

    const currentEntries = entries.filter(entry => entry.date >= weekStart && entry.date <= weekEnd);
    const previousEntries = entries.filter(entry => entry.date >= previousStart && entry.date <= previousEnd);

    const moodTrend = buildMoodTrend(currentEntries, previousEntries);
    const topTags = pickTopTags(currentEntries, 3);

    return {
        weekStart,
        weekEnd,
        generatedAt: new Date().toISOString(),
        recordCount: currentEntries.length,
        moodTrend,
        topTags,
        suggestion: buildSuggestion(currentEntries.length, moodTrend, topTags)
    };
};

export async function getWeeklyInsight(weekStart?: string): Promise<WeeklyInsight> {
    const targetWeekStart = normalizeWeekStart(weekStart);
    const settings = await fetchSettings();
    const cache = getSettingsInsightCache(settings);
    const cached = cache[targetWeekStart];

    if (cached) {
        return cached;
    }

    return refreshWeeklyInsight(true, targetWeekStart);
}

export async function refreshWeeklyInsight(force = false, weekStart?: string): Promise<WeeklyInsight> {
    const targetWeekStart = normalizeWeekStart(weekStart);
    const settings = await fetchSettings();
    const cache = getSettingsInsightCache(settings);

    if (!force && cache[targetWeekStart]) {
        return cache[targetWeekStart];
    }

    const insight = await computeWeeklyInsight(targetWeekStart);
    const nextCache = keepRecentInsightCache({
        ...cache,
        [targetWeekStart]: insight
    });

    await updateSettings({ weekly_insight_cache: nextCache });

    return insight;
}



// ==================== V2 APIs ====================

export interface EntryV2Filters {
    moodScore?: MoodScore;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface EntryV2CreateData {
    date: string;
    time: string;
    mood_score: MoodScore;
    quick_note?: string;
    full_note?: string;
    location?: string;
    images?: string[];
    activity_ids?: number[];
}

export interface EntryV2UpdateData {
    date?: string;
    time?: string;
    mood_score?: MoodScore;
    quick_note?: string;
    full_note?: string;
    location?: string;
    images?: string[];
    activity_ids?: number[];
}

export interface CreateActivityGroupData {
    name: string;
}

export interface UpdateActivityGroupData {
    name?: string;
}

export interface CreateActivityData {
    group_id: number;
    name: string;
    icon?: string;
}

export interface UpdateActivityData {
    group_id?: number;
    name?: string;
    icon?: string;
}

export interface MoodScoreDistribution {
    score: MoodScore;
    count: number;
    percent: number;
}

export interface ActivityFrequency {
    activity_id: number;
    name: string;
    count: number;
    ratioPercent: number;
}

export interface TrendPointV2 {
    day: string;
    entryCount: number;
    avgMood: number;
}

export interface StatsV2 {
    total_entries: number;
    streak_days: number;
    average_mood_7d: number;
    average_mood_30d: number;
    mood_distribution: MoodScoreDistribution[];
    top_activities: ActivityFrequency[];
    trend_7d: TrendPointV2[];
    trend_30d: TrendPointV2[];
}

export async function fetchEntriesV2(filters: EntryV2Filters = {}): Promise<EntryV2[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.fetchEntriesV2(filters);
    }
    return webStorage.webFetchEntriesV2(filters);
}

export async function fetchEntryV2(id: number): Promise<EntryV2> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.fetchEntryV2(id);
    }
    return webStorage.webFetchEntryV2(id);
}

export async function fetchEntriesV2ByDate(date: string): Promise<EntryV2[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.fetchEntriesV2ByDate(date);
    }
    return webStorage.webFetchEntriesV2ByDate(date);
}

export async function searchEntriesV2(query: string): Promise<EntryV2[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.searchEntriesV2(query);
    }
    return webStorage.webSearchEntriesV2(query);
}

export async function createEntryV2(data: EntryV2CreateData): Promise<EntryV2> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.createEntryV2(data);
    }
    return webStorage.webCreateEntryV2(data);
}

export async function updateEntryV2(id: number, data: EntryV2UpdateData): Promise<EntryV2> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.updateEntryV2(id, data);
    }
    return webStorage.webUpdateEntryV2(id, data);
}

export async function deleteEntryV2(id: number): Promise<void> {
    if (isNative) {
        await ensureNativeStorageReady();
        return entriesStorageV2.deleteEntryV2(id);
    }
    return webStorage.webDeleteEntryV2(id);
}

export async function fetchActivityGroups(includeArchived = false): Promise<ActivityGroupWithItems[]> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.fetchActivityGroups(includeArchived);
    }
    return webStorage.webFetchActivityGroups(includeArchived);
}

export async function fetchRecentActivities(limit = 5): Promise<RecentActivityItem[]> {
    const recentEntries = await fetchEntriesV2({ limit: 10 });
    const activityMap = new Map<number, RecentActivityItem>();

    recentEntries.forEach((entry) => {
        const lastUsedAt = entry.updated_at || `${entry.date}T${entry.time}:00`;

        (entry.activities || []).forEach((activity) => {
            const existing = activityMap.get(activity.id);
            if (existing) {
                existing.count += 1;
                if (lastUsedAt > existing.lastUsedAt) {
                    existing.lastUsedAt = lastUsedAt;
                }
                return;
            }

            activityMap.set(activity.id, {
                id: activity.id,
                group_id: activity.group_id,
                name: activity.name,
                icon: activity.icon,
                count: 1,
                lastUsedAt
            });
        });
    });

    return Array.from(activityMap.values())
        .sort((a, b) => (b.count - a.count) || b.lastUsedAt.localeCompare(a.lastUsedAt))
        .slice(0, Math.max(1, limit));
}

export async function createActivityGroup(data: CreateActivityGroupData) {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.createActivityGroup(data);
    }
    return webStorage.webCreateActivityGroup(data);
}

export async function updateActivityGroup(id: number, data: UpdateActivityGroupData) {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.updateActivityGroup(id, data);
    }
    return webStorage.webUpdateActivityGroup(id, data);
}

export async function reorderActivityGroups(groupIds: number[]): Promise<void> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.reorderActivityGroups(groupIds);
    }
    return webStorage.webReorderActivityGroups(groupIds);
}

export async function createActivity(data: CreateActivityData): Promise<ActivityItem> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.createActivity(data);
    }
    return webStorage.webCreateActivity(data);
}

export async function updateActivity(id: number, data: UpdateActivityData): Promise<ActivityItem> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.updateActivity(id, data);
    }
    return webStorage.webUpdateActivity(id, data);
}

export async function moveActivity(id: number, targetGroupId: number): Promise<ActivityItem> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.moveActivity(id, targetGroupId);
    }
    return webStorage.webMoveActivity(id, targetGroupId);
}

export async function archiveActivity(id: number, archived = true): Promise<ActivityItem> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.archiveActivity(id, archived);
    }
    return webStorage.webArchiveActivity(id, archived);
}

export async function reorderActivities(groupId: number, activityIds: number[]): Promise<void> {
    if (isNative) {
        await ensureNativeStorageReady();
        return activitiesStorage.reorderActivities(groupId, activityIds);
    }
    return webStorage.webReorderActivities(groupId, activityIds);
}

export async function fetchStatsV2(): Promise<StatsV2> {
    if (isNative) {
        await ensureNativeStorageReady();
        return statsStorageV2.fetchStatsV2();
    }
    return webStorage.webFetchStatsV2();
}

export async function getRecordDraftV2(): Promise<RecordDraftV2> {
    return webStorage.webGetRecordDraftV2();
}

export async function saveRecordDraftV2(draft: Partial<RecordDraftV2>): Promise<RecordDraftV2> {
    return webStorage.webSaveRecordDraftV2(draft);
}

export async function clearRecordDraftV2(): Promise<void> {
    webStorage.webClearRecordDraftV2();
}

// ==================== V2 Backup & Insight APIs ====================

export interface ImportResultV2 {
    success: true;
    restoredAt: string;
    entries: number;
    groups: number;
    activities: number;
}

export interface WeeklyInsightV2 {
    weekStart: string;
    weekEnd: string;
    generatedAt: string;
    recordCount: number;
    averageMood: number;
    moodDelta: {
        currentAverage: number;
        previousAverage: number;
        delta: number;
    };
    moodDistribution: MoodScoreDistribution[];
    topActivities: ActivityFrequency[];
    suggestion: string;
}

interface BackupPayloadV2 {
    entries_v2: EntryV2[];
    activity_groups: Array<{ id: number; name: string; sort_order: number; is_default: boolean }>;
    activities: Array<{ id: number; group_id: number; name: string; icon?: string; sort_order: number; is_default: boolean; is_archived: boolean }>;
    settings: SettingsData;
    profile: UserProfile;
}

const BACKUP_VERSION_V2 = 2;
const APP_VERSION_V2 = '1.3.0';

const collectBackupPayloadV2 = async (): Promise<BackupPayloadV2> => {
    const [entries, groups, settings, profile] = await Promise.all([
        fetchEntriesV2(),
        fetchActivityGroups(true),
        fetchSettings(),
        fetchProfile()
    ]);

    return {
        entries_v2: entries,
        activity_groups: groups.map((group) => ({
            id: group.id,
            name: group.name,
            sort_order: group.sort_order,
            is_default: group.is_default
        })),
        activities: groups.flatMap((group) =>
            group.activities.map((activity) => ({
                id: activity.id,
                group_id: activity.group_id,
                name: activity.name,
                icon: activity.icon,
                sort_order: activity.sort_order,
                is_default: activity.is_default,
                is_archived: activity.is_archived
            }))
        ),
        settings,
        profile
    };
};

const normalizeSnapshotV2 = (input: Partial<BackupPayloadV2>): BackupPayloadV2 => {
    return {
        entries_v2: Array.isArray(input.entries_v2) ? input.entries_v2.map((entry: any) => ({
            id: entry.id?.toString() || Date.now().toString(),
            date: entry.date,
            time: entry.time,
            mood_score: [1, 2, 3, 4, 5].includes(Number(entry.mood_score)) ? Number(entry.mood_score) : 3,
            quick_note: entry.quick_note || '',
            full_note: entry.full_note || '',
            location: entry.location || '',
            images: Array.isArray(entry.images) ? entry.images : [],
            activity_ids: Array.isArray(entry.activity_ids) ? entry.activity_ids : [],
            created_at: entry.created_at,
            updated_at: entry.updated_at
        })) : [],
        activity_groups: Array.isArray(input.activity_groups) ? input.activity_groups.map((group: any, index: number) => ({
            id: Number.isFinite(Number(group.id)) ? Number(group.id) : index + 1,
            name: String(group.name || `分组 ${index + 1}`),
            sort_order: Number.isFinite(Number(group.sort_order)) ? Number(group.sort_order) : index,
            is_default: !!group.is_default
        })) : [],
        activities: Array.isArray(input.activities) ? input.activities.map((activity: any, index: number) => ({
            id: Number.isFinite(Number(activity.id)) ? Number(activity.id) : index + 1,
            group_id: Number.isFinite(Number(activity.group_id)) ? Number(activity.group_id) : 1,
            name: String(activity.name || `活动 ${index + 1}`),
            icon: activity.icon ? String(activity.icon) : 'label',
            sort_order: Number.isFinite(Number(activity.sort_order)) ? Number(activity.sort_order) : index,
            is_default: !!activity.is_default,
            is_archived: !!activity.is_archived
        })) : [],
        settings: {
            id: 1,
            notification_enabled: input.settings?.notification_enabled ?? true,
            notification_time: input.settings?.notification_time || '20:00',
            reminders: Array.isArray(input.settings?.reminders) ? input.settings!.reminders : [{ id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }],
            theme_id: input.settings?.theme_id || 'forest',
            dark_mode: !!input.settings?.dark_mode,
            dark_mode_option: input.settings?.dark_mode_option === 'light' || input.settings?.dark_mode_option === 'dark' || input.settings?.dark_mode_option === 'system'
                ? input.settings.dark_mode_option
                : 'system',
            amap_key: input.settings?.amap_key,
            weekly_insight_cache: input.settings?.weekly_insight_cache && typeof input.settings.weekly_insight_cache === 'object'
                ? input.settings.weekly_insight_cache
                : {}
        },
        profile: {
            id: 1,
            username: input.profile?.username || '朋友',
            avatar_url: input.profile?.avatar_url
        }
    };
};

const persistImportedPayloadV2Native = async (payload: BackupPayloadV2): Promise<void> => {
    const { getDBConnection } = await import('../src/storage/database');
    const db = await getDBConnection();

    await db.execute('BEGIN TRANSACTION');

    try {
        await db.run('DELETE FROM entry_activities');
        await db.run('DELETE FROM entries_v2');
        await db.run('DELETE FROM activities');
        await db.run('DELETE FROM activity_groups');

        for (const group of payload.activity_groups) {
            await db.run('INSERT INTO activity_groups (id, name, sort_order, is_default) VALUES (?, ?, ?, ?)', [group.id, group.name, group.sort_order, group.is_default ? 1 : 0]);
        }

        for (const activity of payload.activities) {
            await db.run(
                'INSERT INTO activities (id, group_id, name, icon, sort_order, is_default, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [activity.id, activity.group_id, activity.name, activity.icon || null, activity.sort_order, activity.is_default ? 1 : 0, activity.is_archived ? 1 : 0]
            );
        }

        for (const entry of payload.entries_v2) {
            const entryId = Number.parseInt(entry.id, 10);
            if (!Number.isFinite(entryId)) continue;

            await db.run(
                `INSERT INTO entries_v2 (id, date, time, mood_score, quick_note, full_note, location, images, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [entryId, entry.date, entry.time, entry.mood_score, entry.quick_note || '', entry.full_note || '', entry.location || '', JSON.stringify(entry.images || []), entry.created_at || new Date().toISOString(), entry.updated_at || new Date().toISOString()]
            );

            for (const activityId of entry.activity_ids || []) {
                await db.run('INSERT OR IGNORE INTO entry_activities (entry_id, activity_id) VALUES (?, ?)', [entryId, activityId]);
            }
        }

        await db.run(
            `UPDATE settings SET notification_enabled = ?, notification_time = ?, reminders = ?, theme_id = ?, dark_mode = ?, dark_mode_option = ?, amap_key = ?, weekly_insight_cache = ? WHERE id = 1`,
            [
                payload.settings.notification_enabled ? 1 : 0,
                payload.settings.notification_time || '20:00',
                JSON.stringify(payload.settings.reminders || []),
                payload.settings.theme_id || 'forest',
                payload.settings.dark_mode ? 1 : 0,
                payload.settings.dark_mode_option || 'system',
                payload.settings.amap_key || null,
                JSON.stringify(payload.settings.weekly_insight_cache || {})
            ]
        );

        await db.run('UPDATE user_profile SET username = ?, avatar_url = ? WHERE id = 1', [payload.profile.username || '朋友', payload.profile.avatar_url || null]);

        await db.execute('COMMIT');
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
};

const persistImportedPayloadV2 = async (payload: BackupPayloadV2): Promise<void> => {
    if (isNative) {
        await persistImportedPayloadV2Native(payload);
        return;
    }

    webStorage.webImportSnapshotV2(payload as any);
};

export async function exportEncryptedBackupV2(passphrase: string): Promise<File | string> {
    ensurePassphrase(passphrase);

    const payload = await collectBackupPayloadV2();
    const payloadText = JSON.stringify(payload);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(passphrase, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(payloadText));

    const envelope = {
        version: BACKUP_VERSION_V2,
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION_V2,
        crypto: {
            kdf: 'PBKDF2',
            hash: 'SHA-256',
            iterations: PBKDF2_ITERATIONS,
            cipher: 'AES-256-GCM',
            salt: bytesToBase64(salt),
            iv: bytesToBase64(iv)
        },
        payload: bytesToBase64(toUint8Array(encrypted))
    };

    const backupText = JSON.stringify(envelope, null, 2);
    const filename = `moodlistener-backup-v2-${new Date().toISOString().replace(/[:.]/g, '-')}.mlbk`;

    if (isNative) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const result = await Filesystem.writeFile({ path: filename, data: backupText, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
        return result.uri || filename;
    }

    return new File([backupText], filename, { type: 'application/json' });
}

export async function importEncryptedBackupV2(file: File | Blob | string, passphrase: string): Promise<ImportResultV2> {
    ensurePassphrase(passphrase);

    const backupText = await readBackupText(file);
    let parsed: any;

    try {
        parsed = JSON.parse(backupText);
    } catch {
        throw new Error('备份文件格式错误，无法解析');
    }

    if (parsed.version !== BACKUP_VERSION_V2) {
        throw new Error('不支持旧格式备份，仅支持 v2 备份文件');
    }

    try {
        const salt = base64ToBytes(parsed.crypto.salt);
        const iv = base64ToBytes(parsed.crypto.iv);
        const cipherBytes = base64ToBytes(parsed.payload);
        const key = await deriveAesKey(passphrase, salt);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
        const plaintext = new TextDecoder().decode(decrypted);
        const normalized = normalizeSnapshotV2(JSON.parse(plaintext) as Partial<BackupPayloadV2>);

        await persistImportedPayloadV2(normalized);

        return {
            success: true,
            restoredAt: new Date().toISOString(),
            entries: normalized.entries_v2.length,
            groups: normalized.activity_groups.length,
            activities: normalized.activities.length
        };
    } catch {
        throw new Error('口令错误或备份已损坏，导入已中止');
    }
}

const calcAverageMoodFromEntriesV2 = (entries: EntryV2[]): number => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, item) => sum + item.mood_score, 0);
    return Number((total / entries.length).toFixed(2));
};

const calcDistributionV2 = (entries: EntryV2[]): MoodScoreDistribution[] => {
    const total = entries.length;
    const map = new Map<MoodScore, number>([[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]);

    entries.forEach((entry) => {
        map.set(entry.mood_score, (map.get(entry.mood_score) || 0) + 1);
    });

    return ([5, 4, 3, 2, 1] as MoodScore[]).map((score) => {
        const count = map.get(score) || 0;
        return {
            score,
            count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });
};

const pickTopActivitiesV2 = (entries: EntryV2[], limit = 3): ActivityFrequency[] => {
    const counter = new Map<number, ActivityFrequency>();

    entries.forEach((entry) => {
        (entry.activities || []).forEach((activity) => {
            const current = counter.get(activity.id);
            if (current) {
                current.count += 1;
            } else {
                counter.set(activity.id, {
                    activity_id: activity.id,
                    name: activity.name,
                    count: 1,
                    ratioPercent: 0
                });
            }
        });
    });

    return [...counter.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item) => ({ ...item, ratioPercent: entries.length > 0 ? Math.round((item.count / entries.length) * 100) : 0 }));
};

const buildSuggestionV2 = (recordCount: number, delta: number, topActivity?: string): string => {
    if (recordCount === 0) return '最近 7 天还没有记录，先从一条快速笔记开始。';
    if (delta <= -0.5) return '本周平均情绪分下降，建议优先减少高压活动并保持作息。';
    if (delta >= 0.5) return '本周状态有提升，继续保持让你变好的日常活动。';
    if (topActivity) return `本周高频活动是“${topActivity}”，可以继续观察它与情绪分的关系。`;
    return '记录很稳定，继续保持每天一次快速记录。';
};

const computeWeeklyInsightV2 = async (weekStartInput?: string): Promise<WeeklyInsightV2> => {
    const weekStart = normalizeWeekStart(weekStartInput);
    const weekEnd = getWeekEnd(weekStart);

    const previousEndDate = addDays(parseYmd(weekStart)!, -1);
    const previousStart = toLocalDateString(addDays(previousEndDate, -6));
    const previousEnd = toLocalDateString(previousEndDate);

    const entries = await fetchEntriesV2();

    const currentEntries = entries.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd);
    const previousEntries = entries.filter((entry) => entry.date >= previousStart && entry.date <= previousEnd);

    const currentAverage = calcAverageMoodFromEntriesV2(currentEntries);
    const previousAverage = calcAverageMoodFromEntriesV2(previousEntries);
    const delta = Number((currentAverage - previousAverage).toFixed(2));

    const topActivities = pickTopActivitiesV2(currentEntries, 3);

    return {
        weekStart,
        weekEnd,
        generatedAt: new Date().toISOString(),
        recordCount: currentEntries.length,
        averageMood: currentAverage,
        moodDelta: {
            currentAverage,
            previousAverage,
            delta
        },
        moodDistribution: calcDistributionV2(currentEntries),
        topActivities,
        suggestion: buildSuggestionV2(currentEntries.length, delta, topActivities[0]?.name)
    };
};

export async function getWeeklyInsightV2(weekStart?: string): Promise<WeeklyInsightV2> {
    const targetWeekStart = normalizeWeekStart(weekStart);
    const settings = await fetchSettings();
    const cache = settings.weekly_insight_cache || {};

    if ((cache as any)[targetWeekStart]) {
        return (cache as any)[targetWeekStart] as WeeklyInsightV2;
    }

    return refreshWeeklyInsightV2(true, targetWeekStart);
}

export async function refreshWeeklyInsightV2(force = false, weekStart?: string): Promise<WeeklyInsightV2> {
    const targetWeekStart = normalizeWeekStart(weekStart);
    const settings = await fetchSettings();
    const cache = (settings.weekly_insight_cache || {}) as Record<string, WeeklyInsightV2>;

    if (!force && cache[targetWeekStart]) {
        return cache[targetWeekStart];
    }

    const insight = await computeWeeklyInsightV2(targetWeekStart);
    const nextCache = {
        ...cache,
        [targetWeekStart]: insight
    };

    await updateSettings({ weekly_insight_cache: nextCache as any });

    return insight;
}

