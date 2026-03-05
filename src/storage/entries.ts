import { getDBConnection } from './database';
import { deleteImage } from './files';
import { Entry, MoodType } from '../../types';

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
    if (!url) return null;
    if (url.startsWith('data:')) return null;

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

    await Promise.allSettled(filenames.map(name => deleteImage(name)));
};

const mapRowToEntry = (row: any): Entry => {
    return {
        id: row.id.toString(),
        date: row.date,
        time: row.time,
        mood: row.mood as MoodType,
        title: row.title,
        content: row.content,
        tags: parseJsonArray(row.tags),
        location: row.location,
        images: parseJsonArray(row.images),
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

export async function fetchEntries(filters: EntryFilters = {}): Promise<Entry[]> {
    const db = await getDBConnection();
    let sql = 'SELECT * FROM entries WHERE 1=1';
    const params: any[] = [];

    if (filters.mood) {
        sql += ' AND mood = ?';
        params.push(filters.mood);
    }
    if (filters.startDate) {
        sql += ' AND date >= ?';
        params.push(filters.startDate);
    }
    if (filters.endDate) {
        sql += ' AND date <= ?';
        params.push(filters.endDate);
    }

    sql += ' ORDER BY date DESC, time DESC';

    if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
    }
    if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
    }

    const { values } = await db.query(sql, params);
    return (values || []).map(mapRowToEntry);
}

export async function fetchEntry(id: number): Promise<Entry> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM entries WHERE id = ?', [id]);

    if (values && values.length > 0) {
        return mapRowToEntry(values[0]);
    }
    throw new Error('Entry not found');
}

export async function createEntry(data: CreateEntryData): Promise<Entry> {
    const db = await getDBConnection();
    const sql = `
        INSERT INTO entries (date, time, mood, title, content, tags, location, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(sql, [
        data.date,
        data.time,
        data.mood,
        data.title,
        data.content || '',
        JSON.stringify(data.tags || []),
        data.location || '',
        JSON.stringify(data.images || [])
    ]);

    const id = result.changes?.lastId;
    if (!id) throw new Error('Failed to create entry');

    return fetchEntry(id);
}

export async function updateEntry(id: number, data: UpdateEntryData): Promise<Entry> {
    const db = await getDBConnection();
    const existing = await fetchEntry(id);
    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.date !== undefined) { setClauses.push('date = ?'); params.push(data.date); }
    if (data.time !== undefined) { setClauses.push('time = ?'); params.push(data.time); }
    if (data.mood !== undefined) { setClauses.push('mood = ?'); params.push(data.mood); }
    if (data.title !== undefined) { setClauses.push('title = ?'); params.push(data.title); }
    if (data.content !== undefined) { setClauses.push('content = ?'); params.push(data.content); }
    if (data.tags !== undefined) { setClauses.push('tags = ?'); params.push(JSON.stringify(data.tags)); }
    if (data.location !== undefined) { setClauses.push('location = ?'); params.push(data.location); }
    if (data.images !== undefined) { setClauses.push('images = ?'); params.push(JSON.stringify(data.images)); }

    if (setClauses.length === 0) return existing;

    setClauses.push('updated_at = datetime("now", "localtime")');
    params.push(id);

    await db.run(`UPDATE entries SET ${setClauses.join(', ')} WHERE id = ?`, params);

    if (data.images !== undefined) {
        const nextImages = new Set(data.images);
        const removed = (existing.images || []).filter(img => !nextImages.has(img));
        await removeImages(removed);
    }

    return fetchEntry(id);
}

export async function deleteEntry(id: number): Promise<void> {
    const db = await getDBConnection();
    const existing = await fetchEntry(id);

    await db.run('DELETE FROM entries WHERE id = ?', [id]);
    await removeImages(existing.images || []);
}

export async function searchEntries(query: string): Promise<Entry[]> {
    const db = await getDBConnection();
    const searchTerm = `%${query}%`;
    const { values } = await db.query(
        `SELECT * FROM entries
         WHERE title LIKE ? OR content LIKE ? OR location LIKE ?
         ORDER BY date DESC, time DESC`,
        [searchTerm, searchTerm, searchTerm]
    );
    return (values || []).map(mapRowToEntry);
}

export async function fetchEntriesByDate(date: string): Promise<Entry[]> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM entries WHERE date = ? ORDER BY time DESC', [date]);
    return (values || []).map(mapRowToEntry);
}
