/**
 * API 服务层封装 - 本地离线版
 * 自动检测运行环境，在 Web 使用 localStorage，在原生使用 SQLite
 */

import { Entry, MoodType } from '../types';
import { Capacitor } from '@capacitor/core';
import * as webStorage from '../src/storage/webStorage';

// 检测是否在原生环境
const isNative = Capacitor.isNativePlatform();

// 初始化（Web 环境需要初始化 localStorage）
if (!isNative) {
    webStorage.initWebStorage();
}

// 动态导入原生存储模块（仅在原生环境使用）
let entriesStorage: any = null;
let statsStorage: any = null;
let settingsStorage: any = null;
let tagsStorage: any = null;
let filesStorage: any = null;

if (isNative) {
    // 原生环境：使用 SQLite
    import('../src/storage/entries').then(m => entriesStorage = m);
    import('../src/storage/stats').then(m => statsStorage = m);
    import('../src/storage/settings').then(m => settingsStorage = m);
    import('../src/storage/tags').then(m => tagsStorage = m);
    import('../src/storage/files').then(m => filesStorage = m);
}

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
    if (isNative && entriesStorage) {
        return entriesStorage.fetchEntries(filters);
    }
    return webStorage.webFetchEntries(filters);
}

export async function fetchEntry(id: number): Promise<Entry> {
    if (isNative && entriesStorage) {
        return entriesStorage.fetchEntry(id);
    }
    return webStorage.webFetchEntry(id);
}

export async function fetchEntriesByDate(date: string): Promise<Entry[]> {
    if (isNative && entriesStorage) {
        return entriesStorage.fetchEntriesByDate(date);
    }
    return webStorage.webFetchEntriesByDate(date);
}

export async function searchEntries(query: string): Promise<Entry[]> {
    if (isNative && entriesStorage) {
        return entriesStorage.searchEntries(query);
    }
    return webStorage.webSearchEntries(query);
}

export async function createEntry(data: CreateEntryData): Promise<Entry> {
    if (isNative && entriesStorage) {
        return entriesStorage.createEntry(data);
    }
    return webStorage.webCreateEntry(data);
}

export async function updateEntry(id: number, data: UpdateEntryData): Promise<Entry> {
    if (isNative && entriesStorage) {
        return entriesStorage.updateEntry(id, data);
    }
    return webStorage.webUpdateEntry(id, data);
}

export async function deleteEntry(id: number): Promise<void> {
    if (isNative && entriesStorage) {
        return entriesStorage.deleteEntry(id);
    }
    return webStorage.webDeleteEntry(id);
}

// ==================== Stats API ====================

export async function fetchStats(): Promise<StatsData> {
    if (isNative && statsStorage) {
        return statsStorage.fetchStats();
    }
    return webStorage.webFetchStats();
}

// ==================== Settings API ====================

export async function fetchSettings(): Promise<SettingsData> {
    if (isNative && settingsStorage) {
        return settingsStorage.fetchSettings();
    }
    return webStorage.webFetchSettings();
}

export async function updateSettings(data: UpdateSettingsData): Promise<SettingsData> {
    if (isNative && settingsStorage) {
        return settingsStorage.updateSettings(data);
    }
    return webStorage.webUpdateSettings(data);
}

// ==================== Export API ====================

type ExportFormat = 'csv' | 'json' | 'txt';

export async function exportData(format: ExportFormat): Promise<void> {
    const entries = await fetchEntries();
    let content = '';

    if (format === 'json') {
        content = JSON.stringify(entries, null, 2);
    } else if (format === 'csv') {
        content = 'Date,Time,Mood,Title,Content\n' +
            entries.map(e => `${e.date},${e.time},${e.mood},"${e.title}","${e.content || ''}"`).join('\n');
    } else {
        content = entries.map(e => `[${e.date} ${e.time}] ${e.mood} - ${e.title}\n${e.content || ''}`).join('\n\n');
    }

    if (isNative) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const filename = `moodlistener_export_${Date.now()}.${format}`;
        await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });
        alert(`已导出到文档目录: ${filename}`);
    } else {
        // Web: 触发下载
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moodlistener_export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ==================== Profile API ====================

export async function fetchProfile(): Promise<UserProfile> {
    if (isNative && settingsStorage) {
        return settingsStorage.fetchProfile();
    }
    return webStorage.webFetchProfile();
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    if (isNative && settingsStorage) {
        return settingsStorage.updateProfile(data);
    }
    return webStorage.webUpdateProfile(data);
}

// ==================== Tags API ====================

export async function fetchTags(): Promise<TagsByMood> {
    if (isNative && tagsStorage) {
        return tagsStorage.fetchTags();
    }
    return webStorage.webFetchTags();
}

export async function fetchTagsByMood(moodType: MoodType): Promise<Tag[]> {
    if (isNative && tagsStorage) {
        return tagsStorage.fetchTagsByMood(moodType);
    }
    return webStorage.webFetchTagsByMood(moodType);
}

export async function createTag(data: CreateTagData): Promise<Tag> {
    if (isNative && tagsStorage) {
        return tagsStorage.createTag(data);
    }
    return webStorage.webCreateTag(data);
}

export async function deleteTag(id: number): Promise<void> {
    if (isNative && tagsStorage) {
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
    if (isNative && filesStorage) {
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
