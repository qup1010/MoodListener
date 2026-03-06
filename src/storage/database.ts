import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DEFAULT_ACTIVITY_GROUP_SEEDS } from '../constants/moodV2';

const DB_NAME = 'moodlistener.db';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbConnection: SQLiteDBConnection | null = null;
let isInitialized = false;

const MOJIBAKE_REPLACEMENT_CHAR = '\uFFFD';

const looksCorruptedText = (value?: string | null): boolean => {
    if (!value || typeof value !== 'string') return false;
    return value.includes(MOJIBAKE_REPLACEMENT_CHAR);
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    mood TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    location TEXT,
    images TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    notification_enabled INTEGER DEFAULT 1,
    notification_time TEXT DEFAULT "20:00",
    reminders TEXT DEFAULT NULL,
    theme_id TEXT DEFAULT "forest",
    dark_mode INTEGER DEFAULT 0,
    dark_mode_option TEXT DEFAULT "system",
    weekly_insight_cache TEXT DEFAULT NULL,
    amap_key TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    username TEXT DEFAULT "朋友",
    avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mood_type TEXT NOT NULL,
    is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entries_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    mood_score INTEGER NOT NULL CHECK(mood_score BETWEEN 1 AND 5),
    quick_note TEXT,
    full_note TEXT,
    location TEXT,
    images TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS activity_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (group_id) REFERENCES activity_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entry_activities (
    entry_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    PRIMARY KEY(entry_id, activity_id),
    FOREIGN KEY (entry_id) REFERENCES entries_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_version (
    version INTEGER PRIMARY KEY DEFAULT 1,
    initialized_at TEXT DEFAULT (datetime('now', 'localtime'))
);

INSERT OR IGNORE INTO settings (id) VALUES (1);
INSERT OR IGNORE INTO user_profile (id) VALUES (1);
INSERT OR IGNORE INTO db_version (version) VALUES (1);
`;

const seedLegacyTags = async (db: SQLiteDBConnection) => {
    const checkTags = await db.query('SELECT COUNT(*) as count FROM tags');
    const tagCount = checkTags.values?.[0]?.count || 0;

    if (tagCount > 0) {
        return;
    }

    const defaultTagsSql = `
        INSERT INTO tags (name, mood_type, is_default) VALUES
        ('开心', 'positive', 1), ('兴奋', 'positive', 1), ('感恩', 'positive', 1),
        ('平静', 'neutral', 1), ('思考', 'neutral', 1), ('疲惫', 'neutral', 1),
        ('难过', 'negative', 1), ('焦虑', 'negative', 1), ('生气', 'negative', 1);
    `;

    await db.execute(defaultTagsSql);

    const defaultReminders = JSON.stringify([
        { id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }
    ]);

    await db.run('UPDATE settings SET reminders = ? WHERE id = 1', [defaultReminders]);
};

const seedDefaultActivities = async (db: SQLiteDBConnection) => {
    const checkGroups = await db.query('SELECT COUNT(*) as count FROM activity_groups');
    const groupCount = checkGroups.values?.[0]?.count || 0;

    if (groupCount > 0) {
        return;
    }

    await db.execute('BEGIN TRANSACTION');

    try {
        for (let groupIndex = 0; groupIndex < DEFAULT_ACTIVITY_GROUP_SEEDS.length; groupIndex++) {
            const groupSeed = DEFAULT_ACTIVITY_GROUP_SEEDS[groupIndex];
            const groupInsert = await db.run(
                'INSERT INTO activity_groups (name, sort_order, is_default) VALUES (?, ?, 1)',
                [groupSeed.name, groupIndex]
            );

            const groupId = groupInsert.changes?.lastId;
            if (!groupId) {
                throw new Error(`Failed to insert default activity group: ${groupSeed.name}`);
            }

            for (let activityIndex = 0; activityIndex < groupSeed.activities.length; activityIndex++) {
                const activitySeed = groupSeed.activities[activityIndex];
                await db.run(
                    'INSERT INTO activities (group_id, name, icon, sort_order, is_default, is_archived) VALUES (?, ?, ?, ?, 1, 0)',
                    [groupId, activitySeed.name, activitySeed.icon, activityIndex]
                );
            }
        }

        await db.execute('COMMIT');
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
};

const repairDefaultActivitiesText = async (db: SQLiteDBConnection) => {
    const groupRows = await db.query('SELECT id, name, sort_order, is_default FROM activity_groups WHERE is_default = 1 ORDER BY sort_order ASC, id ASC');
    const groups = groupRows.values || [];
    const groupSeedById = new Map<number, typeof DEFAULT_ACTIVITY_GROUP_SEEDS[number]>();

    for (const group of groups) {
        const seed = DEFAULT_ACTIVITY_GROUP_SEEDS[group.sort_order] || DEFAULT_ACTIVITY_GROUP_SEEDS[groups.indexOf(group)];
        if (!seed) continue;
        groupSeedById.set(Number(group.id), seed);

        if (looksCorruptedText(group.name)) {
            await db.run(
                'UPDATE activity_groups SET name = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
                [seed.name, group.id]
            );
        }
    }

    const activityRows = await db.query('SELECT id, group_id, name, sort_order, is_default FROM activities WHERE is_default = 1 ORDER BY group_id ASC, sort_order ASC, id ASC');
    for (const activity of activityRows.values || []) {
        const groupSeed = groupSeedById.get(Number(activity.group_id));
        const activitySeed = groupSeed?.activities?.[activity.sort_order];
        if (!activitySeed) continue;

        if (looksCorruptedText(activity.name)) {
            await db.run(
                'UPDATE activities SET name = ?, icon = COALESCE(icon, ?), updated_at = datetime("now", "localtime") WHERE id = ?',
                [activitySeed.name, activitySeed.icon, activity.id]
            );
        }
    }
};

const ensureDefaultActivities = async (db: SQLiteDBConnection) => {
    const groupRows = await db.query('SELECT id, sort_order, is_default FROM activity_groups WHERE is_default = 1 ORDER BY sort_order ASC, id ASC');
    const groups = groupRows.values || [];

    for (const group of groups) {
        const seed = DEFAULT_ACTIVITY_GROUP_SEEDS[group.sort_order] || DEFAULT_ACTIVITY_GROUP_SEEDS[groups.indexOf(group)];
        if (!seed) continue;

        const existingRows = await db.query(
            'SELECT name FROM activities WHERE group_id = ? AND is_default = 1',
            [group.id]
        );
        const existingNames = new Set((existingRows.values || []).map((row) => row.name));

        for (let activityIndex = 0; activityIndex < seed.activities.length; activityIndex++) {
            const activitySeed = seed.activities[activityIndex];
            if (existingNames.has(activitySeed.name)) continue;

            await db.run(
                'INSERT INTO activities (group_id, name, icon, sort_order, is_default, is_archived) VALUES (?, ?, ?, ?, 1, 0)',
                [group.id, activitySeed.name, activitySeed.icon, activityIndex]
            );
        }
    }
};

const repairWeeklyInsightCache = async (db: SQLiteDBConnection) => {
    const result = await db.query('SELECT weekly_insight_cache FROM settings WHERE id = 1');
    const raw = result.values?.[0]?.weekly_insight_cache;
    if (typeof raw !== 'string' || raw.length === 0) {
        return;
    }

    if (looksCorruptedText(raw)) {
        await db.run('UPDATE settings SET weekly_insight_cache = ? WHERE id = 1', ['{}']);
    }
};

const repairPersistedText = async (db: SQLiteDBConnection) => {
    await repairDefaultActivitiesText(db);
    await ensureDefaultActivities(db);
    await repairWeeklyInsightCache(db);
};

export const getDBConnection = async (): Promise<SQLiteDBConnection> => {
    if (dbConnection) {
        const isConnected = await dbConnection.isDBOpen();
        if (isConnected.result) {
            return dbConnection;
        }
    }

    try {
        dbConnection = await sqlite.createConnection(
            DB_NAME,
            false,
            'no-encryption',
            1,
            false
        );

        await dbConnection.open();

        if (!isInitialized) {
            await dbConnection.execute(SCHEMA_SQL);

            try {
                await dbConnection.execute('ALTER TABLE settings ADD COLUMN amap_key TEXT DEFAULT NULL');
            } catch {
                // column exists
            }

            try {
                await dbConnection.execute('ALTER TABLE settings ADD COLUMN dark_mode_option TEXT DEFAULT "system"');
            } catch {
                // column exists
            }

            try {
                await dbConnection.execute('ALTER TABLE settings ADD COLUMN weekly_insight_cache TEXT DEFAULT NULL');
            } catch {
                // column exists
            }

            await dbConnection.execute(
                'UPDATE settings SET dark_mode_option = CASE WHEN dark_mode = 1 THEN "dark" ELSE "light" END ' +
                'WHERE dark_mode_option IS NULL OR dark_mode_option NOT IN ("light", "dark", "system")'
            );

            await seedLegacyTags(dbConnection);
            await seedDefaultActivities(dbConnection);
            await repairPersistedText(dbConnection);

            isInitialized = true;
        }

        return dbConnection;
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
};

export const closeConnection = async () => {
    if (dbConnection) {
        try {
            await dbConnection.close();
            await sqlite.closeConnection(DB_NAME, false);
            dbConnection = null;
        } catch (err) {
            console.error('Error closing database:', err);
        }
    }
};
