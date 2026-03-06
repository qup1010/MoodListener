import { ActivityGroup, ActivityGroupWithItems, ActivityItem } from '../../types';
import { getDBConnection } from './database';

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

const mapGroup = (row: any): ActivityGroup => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_default: !!row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at
});

const mapActivity = (row: any): ActivityItem => ({
    id: row.id,
    group_id: row.group_id,
    name: row.name,
    icon: row.icon || undefined,
    sort_order: row.sort_order,
    is_default: !!row.is_default,
    is_archived: !!row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export async function fetchActivityGroups(includeArchived = false): Promise<ActivityGroupWithItems[]> {
    const db = await getDBConnection();

    const [groupRows, activityRows] = await Promise.all([
        db.query('SELECT * FROM activity_groups ORDER BY sort_order ASC, id ASC'),
        includeArchived
            ? db.query('SELECT * FROM activities ORDER BY group_id ASC, sort_order ASC, id ASC')
            : db.query('SELECT * FROM activities WHERE is_archived = 0 ORDER BY group_id ASC, sort_order ASC, id ASC')
    ]);

    const groups = (groupRows.values || []).map(mapGroup);
    const itemsByGroup = new Map<number, ActivityItem[]>();

    for (const row of activityRows.values || []) {
        const activity = mapActivity(row);
        const current = itemsByGroup.get(activity.group_id) || [];
        current.push(activity);
        itemsByGroup.set(activity.group_id, current);
    }

    return groups.map((group) => ({
        ...group,
        activities: itemsByGroup.get(group.id) || []
    }));
}

export async function fetchActivitiesByIds(ids: number[]): Promise<ActivityItem[]> {
    const uniqueIds = [...new Set(ids)].filter((id) => Number.isFinite(id));
    if (uniqueIds.length === 0) return [];

    const db = await getDBConnection();
    const placeholders = uniqueIds.map(() => '?').join(',');
    const { values } = await db.query(
        `SELECT * FROM activities WHERE id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
        uniqueIds
    );

    return (values || []).map(mapActivity);
}

export async function createActivityGroup(data: CreateActivityGroupData): Promise<ActivityGroup> {
    const db = await getDBConnection();

    const maxRes = await db.query('SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM activity_groups');
    const nextSortOrder = Number(maxRes.values?.[0]?.max_sort || -1) + 1;

    const result = await db.run(
        'INSERT INTO activity_groups (name, sort_order, is_default) VALUES (?, ?, 0)',
        [data.name, nextSortOrder]
    );

    const groupId = result.changes?.lastId;
    if (!groupId) {
        throw new Error('Create group failed');
    }

    const row = await db.query('SELECT * FROM activity_groups WHERE id = ?', [groupId]);
    if (!row.values?.[0]) {
        throw new Error('Create group failed');
    }

    return mapGroup(row.values[0]);
}

export async function updateActivityGroup(id: number, data: UpdateActivityGroupData): Promise<ActivityGroup> {
    const db = await getDBConnection();

    if (data.name !== undefined) {
        await db.run(
            'UPDATE activity_groups SET name = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
            [data.name, id]
        );
    }

    const row = await db.query('SELECT * FROM activity_groups WHERE id = ?', [id]);
    if (!row.values?.[0]) {
        throw new Error('Group not found');
    }

    return mapGroup(row.values[0]);
}

export async function reorderActivityGroups(groupIds: number[]): Promise<void> {
    const db = await getDBConnection();
    const unique = [...new Set(groupIds)].filter((id) => Number.isFinite(id));

    await db.execute('BEGIN TRANSACTION');
    try {
        for (let index = 0; index < unique.length; index++) {
            await db.run(
                'UPDATE activity_groups SET sort_order = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
                [index, unique[index]]
            );
        }
        await db.execute('COMMIT');
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
}

export async function createActivity(data: CreateActivityData): Promise<ActivityItem> {
    const db = await getDBConnection();

    const maxRes = await db.query(
        'SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM activities WHERE group_id = ?',
        [data.group_id]
    );
    const nextSortOrder = Number(maxRes.values?.[0]?.max_sort || -1) + 1;

    const result = await db.run(
        'INSERT INTO activities (group_id, name, icon, sort_order, is_default, is_archived) VALUES (?, ?, ?, ?, 0, 0)',
        [data.group_id, data.name, data.icon || null, nextSortOrder]
    );

    const activityId = result.changes?.lastId;
    if (!activityId) {
        throw new Error('Create activity failed');
    }

    const row = await db.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    if (!row.values?.[0]) {
        throw new Error('Create activity failed');
    }

    return mapActivity(row.values[0]);
}

export async function updateActivity(id: number, data: UpdateActivityData): Promise<ActivityItem> {
    const db = await getDBConnection();

    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.group_id !== undefined) {
        setClauses.push('group_id = ?');
        params.push(data.group_id);
    }
    if (data.name !== undefined) {
        setClauses.push('name = ?');
        params.push(data.name);
    }
    if (data.icon !== undefined) {
        setClauses.push('icon = ?');
        params.push(data.icon || null);
    }

    if (setClauses.length > 0) {
        setClauses.push('updated_at = datetime("now", "localtime")');
        params.push(id);
        await db.run(`UPDATE activities SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const row = await db.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (!row.values?.[0]) {
        throw new Error('Activity not found');
    }

    return mapActivity(row.values[0]);
}

export async function moveActivity(id: number, targetGroupId: number): Promise<ActivityItem> {
    const db = await getDBConnection();

    const maxRes = await db.query(
        'SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM activities WHERE group_id = ?',
        [targetGroupId]
    );

    const nextSortOrder = Number(maxRes.values?.[0]?.max_sort || -1) + 1;

    await db.run(
        'UPDATE activities SET group_id = ?, sort_order = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [targetGroupId, nextSortOrder, id]
    );

    const row = await db.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (!row.values?.[0]) {
        throw new Error('Activity not found');
    }

    return mapActivity(row.values[0]);
}

export async function archiveActivity(id: number, archived = true): Promise<ActivityItem> {
    const db = await getDBConnection();

    await db.run(
        'UPDATE activities SET is_archived = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [archived ? 1 : 0, id]
    );

    const row = await db.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (!row.values?.[0]) {
        throw new Error('Activity not found');
    }

    return mapActivity(row.values[0]);
}

export async function reorderActivities(groupId: number, activityIds: number[]): Promise<void> {
    const db = await getDBConnection();
    const unique = [...new Set(activityIds)].filter((id) => Number.isFinite(id));

    await db.execute('BEGIN TRANSACTION');
    try {
        for (let index = 0; index < unique.length; index++) {
            await db.run(
                `UPDATE activities
                 SET sort_order = ?, group_id = ?, updated_at = datetime("now", "localtime")
                 WHERE id = ?`,
                [index, groupId, unique[index]]
            );
        }
        await db.execute('COMMIT');
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
}
