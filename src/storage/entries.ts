import { getDBConnection } from './database';
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

const mapRowToEntry = (row: any): Entry => {
    return {
        id: row.id.toString(),
        date: row.date,
        time: row.time,
        mood: row.mood as MoodType,
        title: row.title,
        content: row.content,
        tags: row.tags ? JSON.parse(row.tags) : [],
        location: row.location,
        images: row.images ? JSON.parse(row.images) : [],
        created_at: row.created_at,
        updated_at: row.updated_at,
        // images isn't in Entry interface in types.ts but is in CreateEntryData? 
        // Checking types.ts content history: types.ts Entry didn't have images field visible in the snippet?
        // Wait, let me double check types.ts snippet in Step 18.
        // It showed:
        // export interface Entry { ... tags: string[]; location?: string; ... }
        // It did NOT show images in Entry interface. 
        // But backend CreateEntryData had images.
        // I should probably add images to Entry interface in types.ts or just ignore it for now if frontend doesn't use it yet.
        // However, the user request #9bee... "Mood App Feature Expansion" mentioned "Integrating image attachment support".
        // So images SHOULD be in Entry. I might need to update types.ts too.
        // For now I will include it in the object even if TS complains, or better, update types.ts later.
        // Actually, let's map it, and I'll update types.ts in a separate step to be safe.
        // properties not in interface will just be extra. 
    } as any;
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
    const sql = 'SELECT * FROM entries WHERE id = ?';
    const { values } = await db.query(sql, [id]);

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

    const params = [
        data.date,
        data.time,
        data.mood,
        data.title,
        data.content || '',
        JSON.stringify(data.tags || []),
        data.location || '',
        JSON.stringify(data.images || [])
    ];

    const result = await db.run(sql, params);
    const id = result.changes?.lastId;

    if (!id) throw new Error('Failed to create entry');

    return fetchEntry(id);
}

export async function updateEntry(id: number, data: UpdateEntryData): Promise<Entry> {
    const db = await getDBConnection();
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

    if (setClauses.length === 0) return fetchEntry(id);

    setClauses.push('updated_at = datetime("now", "localtime")');

    const sql = `UPDATE entries SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(id);

    await db.run(sql, params);
    return fetchEntry(id);
}

export async function deleteEntry(id: number): Promise<void> {
    const db = await getDBConnection();
    await db.run('DELETE FROM entries WHERE id = ?', [id]);
}

export async function searchEntries(query: string): Promise<Entry[]> {
    const db = await getDBConnection();
    const sql = `
        SELECT * FROM entries 
        WHERE title LIKE ? OR content LIKE ? OR location LIKE ?
        ORDER BY date DESC, time DESC
    `;
    const searchTerm = `%${query}%`;
    const { values } = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
    return (values || []).map(mapRowToEntry);
}

export async function fetchEntriesByDate(date: string): Promise<Entry[]> {
    const db = await getDBConnection();
    const sql = 'SELECT * FROM entries WHERE date = ? ORDER BY time DESC';
    const { values } = await db.query(sql, [date]);
    return (values || []).map(mapRowToEntry);
}
