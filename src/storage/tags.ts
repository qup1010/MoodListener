import { getDBConnection } from './database';
import { MoodType } from '../../types';

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

export async function fetchTags(): Promise<TagsByMood> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM tags');

    const tags = (values || []).map(row => ({
        id: row.id,
        name: row.name,
        mood_type: row.mood_type as MoodType,
        is_default: !!row.is_default
    }));

    return {
        positive: tags.filter(t => t.mood_type === 'positive'),
        neutral: tags.filter(t => t.mood_type === 'neutral'),
        negative: tags.filter(t => t.mood_type === 'negative')
    };
}

export async function fetchTagsByMood(moodType: MoodType): Promise<Tag[]> {
    const db = await getDBConnection();
    const { values } = await db.query('SELECT * FROM tags WHERE mood_type = ?', [moodType]);

    return (values || []).map(row => ({
        id: row.id,
        name: row.name,
        mood_type: row.mood_type as MoodType,
        is_default: !!row.is_default
    }));
}

export async function createTag(data: CreateTagData): Promise<Tag> {
    const db = await getDBConnection();
    const sql = 'INSERT INTO tags (name, mood_type, is_default) VALUES (?, ?, 0)';
    const result = await db.run(sql, [data.name, data.mood_type]);

    if (result.changes?.lastId) {
        return {
            id: result.changes.lastId,
            name: data.name,
            mood_type: data.mood_type,
            is_default: false
        };
    }
    throw new Error('Create tag failed');
}

export async function deleteTag(id: number): Promise<void> {
    const db = await getDBConnection();
    await db.run('DELETE FROM tags WHERE id = ?', [id]);
}
