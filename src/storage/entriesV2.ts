import { getDBConnection } from './database';
import { deleteImage } from './files';
import { ActivityItem, EntryV2, MoodScore } from '../../types';

export interface EntryV2Filters {
    moodScore?: MoodScore;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface CreateEntryV2Data {
    date: string;
    time: string;
    mood_score: MoodScore;
    quick_note?: string;
    full_note?: string;
    location?: string;
    images?: string[];
    activity_ids?: number[];
}

export interface UpdateEntryV2Data {
    date?: string;
    time?: string;
    mood_score?: MoodScore;
    quick_note?: string;
    full_note?: string;
    location?: string;
    images?: string[];
    activity_ids?: number[];
}

const parseJsonArray = (value: string | null | undefined): string[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const extractFilenameFromImageUrl = (url: string): string | null => {
    if (!url || url.startsWith('data:')) return null;

    try {
        const normalized = decodeURIComponent(url).split('?')[0];
        const filename = normalized.split('/').pop() || '';
        return filename || null;
    } catch {
        return null;
    }
};

const removeImages = async (images: string[]) => {
    const filenames = images
        .map(extractFilenameFromImageUrl)
        .filter((name): name is string => !!name);

    await Promise.allSettled(filenames.map((name) => deleteImage(name)));
};

const mapRowToEntryV2 = (row: any): EntryV2 => {
    return {
        id: String(row.id),
        date: row.date,
        time: row.time,
        mood_score: row.mood_score as MoodScore,
        quick_note: row.quick_note || '',
        full_note: row.full_note || '',
        location: row.location || '',
        images: parseJsonArray(row.images),
        activity_ids: [],
        activities: [],
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

const attachEntryActivities = async (entries: EntryV2[]): Promise<EntryV2[]> => {
    if (entries.length === 0) return entries;

    const db = await getDBConnection();
    const entryIds = entries.map((entry) => Number.parseInt(entry.id, 10)).filter(Number.isFinite);

    if (entryIds.length === 0) {
        return entries;
    }

    const placeholders = entryIds.map(() => '?').join(',');
    const sql = `
        SELECT ea.entry_id, a.id, a.group_id, a.name, a.icon, a.sort_order, a.is_default, a.is_archived
        FROM entry_activities ea
        JOIN activities a ON a.id = ea.activity_id
        WHERE ea.entry_id IN (${placeholders})
        ORDER BY a.sort_order ASC, a.id ASC
    `;

    const { values } = await db.query(sql, entryIds);
    const grouped = new Map<number, ActivityItem[]>();

    for (const row of values || []) {
        const entryId = Number(row.entry_id);
        const current = grouped.get(entryId) || [];
        current.push({
            id: row.id,
            group_id: row.group_id,
            name: row.name,
            icon: row.icon || undefined,
            sort_order: row.sort_order,
            is_default: !!row.is_default,
            is_archived: !!row.is_archived
        });
        grouped.set(entryId, current);
    }

    return entries.map((entry) => {
        const numericId = Number.parseInt(entry.id, 10);
        const activities = grouped.get(numericId) || [];
        return {
            ...entry,
            activity_ids: activities.map((item) => item.id),
            activities
        };
    });
};

const replaceEntryActivities = async (entryId: number, activityIds: number[]) => {
    const db = await getDBConnection();

    await db.run('DELETE FROM entry_activities WHERE entry_id = ?', [entryId]);

    const uniqueIds = [...new Set(activityIds.filter((id) => Number.isFinite(id)))];
    for (const activityId of uniqueIds) {
        await db.run(
            'INSERT OR IGNORE INTO entry_activities (entry_id, activity_id) VALUES (?, ?)',
            [entryId, activityId]
        );
    }
};

export async function fetchEntriesV2(filters: EntryV2Filters = {}): Promise<EntryV2[]> {
    const db = await getDBConnection();
    let sql = 'SELECT * FROM entries_v2 WHERE 1=1';
    const params: any[] = [];

    if (filters.moodScore !== undefined) {
        sql += ' AND mood_score = ?';
        params.push(filters.moodScore);
    }
    if (filters.startDate) {
        sql += ' AND date >= ?';
        params.push(filters.startDate);
    }
    if (filters.endDate) {
        sql += ' AND date <= ?';
        params.push(filters.endDate);
    }

    sql += ' ORDER BY date DESC, time DESC, id DESC';

    if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
    }
    if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
    }

    const { values } = await db.query(sql, params);
    const rows = (values || []).map(mapRowToEntryV2);
    return attachEntryActivities(rows);
}

export async function fetchEntryV2(id: number): Promise<EntryV2> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM entries_v2 WHERE id = ?', [id]);

    if (!values || values.length === 0) {
        throw new Error('Entry not found');
    }

    const [entry] = await attachEntryActivities([mapRowToEntryV2(values[0])]);
    return entry;
}

export async function createEntryV2(data: CreateEntryV2Data): Promise<EntryV2> {
    const db = await getDBConnection();
    const result = await db.run(
        `INSERT INTO entries_v2 (date, time, mood_score, quick_note, full_note, location, images)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.date,
            data.time,
            data.mood_score,
            data.quick_note || '',
            data.full_note || '',
            data.location || '',
            JSON.stringify(data.images || [])
        ]
    );

    const id = result.changes?.lastId;
    if (!id) {
        throw new Error('Failed to create entry');
    }

    await replaceEntryActivities(id, data.activity_ids || []);
    return fetchEntryV2(id);
}

export async function updateEntryV2(id: number, data: UpdateEntryV2Data): Promise<EntryV2> {
    const existing = await fetchEntryV2(id);
    const db = await getDBConnection();

    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.date !== undefined) { setClauses.push('date = ?'); params.push(data.date); }
    if (data.time !== undefined) { setClauses.push('time = ?'); params.push(data.time); }
    if (data.mood_score !== undefined) { setClauses.push('mood_score = ?'); params.push(data.mood_score); }
    if (data.quick_note !== undefined) { setClauses.push('quick_note = ?'); params.push(data.quick_note); }
    if (data.full_note !== undefined) { setClauses.push('full_note = ?'); params.push(data.full_note); }
    if (data.location !== undefined) { setClauses.push('location = ?'); params.push(data.location); }
    if (data.images !== undefined) { setClauses.push('images = ?'); params.push(JSON.stringify(data.images)); }

    if (setClauses.length > 0) {
        setClauses.push('updated_at = datetime("now", "localtime")');
        params.push(id);
        await db.run(`UPDATE entries_v2 SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    if (data.activity_ids !== undefined) {
        await replaceEntryActivities(id, data.activity_ids);
    }

    if (data.images !== undefined) {
        const nextImages = new Set(data.images);
        const removed = (existing.images || []).filter((img) => !nextImages.has(img));
        await removeImages(removed);
    }

    return fetchEntryV2(id);
}

export async function deleteEntryV2(id: number): Promise<void> {
    const db = await getDBConnection();
    const existing = await fetchEntryV2(id);

    await db.run('DELETE FROM entries_v2 WHERE id = ?', [id]);
    await removeImages(existing.images || []);
}

export async function searchEntriesV2(query: string): Promise<EntryV2[]> {
    const db = await getDBConnection();
    const searchTerm = `%${query}%`;

    const { values } = await db.query(
        `SELECT DISTINCT e.*
         FROM entries_v2 e
         LEFT JOIN entry_activities ea ON ea.entry_id = e.id
         LEFT JOIN activities a ON a.id = ea.activity_id
         WHERE e.quick_note LIKE ? OR e.full_note LIKE ? OR e.location LIKE ? OR a.name LIKE ?
         ORDER BY e.date DESC, e.time DESC, e.id DESC`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const rows = (values || []).map(mapRowToEntryV2);
    return attachEntryActivities(rows);
}

export async function fetchEntriesV2ByDate(date: string): Promise<EntryV2[]> {
    const db = await getDBConnection();
    const { values } = await db.query(
        'SELECT * FROM entries_v2 WHERE date = ? ORDER BY time DESC, id DESC',
        [date]
    );

    const rows = (values || []).map(mapRowToEntryV2);
    return attachEntryActivities(rows);
}
