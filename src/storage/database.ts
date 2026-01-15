import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'moodlistener.db';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbConnection: SQLiteDBConnection | null = null;
let isInitialized = false;

// 定义表结构 SQL
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
    theme_id TEXT DEFAULT "classic",
    dark_mode INTEGER DEFAULT 0
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

-- 初始化版本控制表
CREATE TABLE IF NOT EXISTS db_version (
    version INTEGER PRIMARY KEY DEFAULT 1,
    initialized_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 初始化默认数据（只在首次创建时执行）
INSERT OR IGNORE INTO settings (id) VALUES (1);
INSERT OR IGNORE INTO user_profile (id) VALUES (1);
INSERT OR IGNORE INTO db_version (version) VALUES (1);
`;

export const getDBConnection = async (): Promise<SQLiteDBConnection> => {
    if (dbConnection) {
        const isConnected = await dbConnection.isDBOpen();
        if (isConnected.result) {
            return dbConnection;
        }
    }

    try {
        // 创建连接
        dbConnection = await sqlite.createConnection(
            DB_NAME,
            false,
            'no-encryption',
            1,
            false
        );

        // 打开数据库
        await dbConnection.open();

        if (!isInitialized) {
            // 执行建表语句
            await dbConnection.execute(SCHEMA_SQL);

            // 检查是否是首次初始化（通过检查tags表是否为空）
            const checkTags = await dbConnection.query('SELECT COUNT(*) as count FROM tags');
            const tagCount = checkTags.values?.[0]?.count || 0;

            if (tagCount === 0) {
                // 首次初始化：插入默认标签
                const DEFAULT_TAGS_SQL = `
                    INSERT INTO tags (name, mood_type, is_default) VALUES 
                    ('开心', 'positive', 1), ('兴奋', 'positive', 1), ('感恩', 'positive', 1),
                    ('平静', 'neutral', 1), ('思考', 'neutral', 1), ('疲惫', 'neutral', 1),
                    ('难过', 'negative', 1), ('焦虑', 'negative', 1), ('生气', 'negative', 1);
                `;
                await dbConnection.execute(DEFAULT_TAGS_SQL);

                // 设置默认 reminders（JSON 格式）
                const defaultReminders = JSON.stringify([
                    { id: '1', time: '20:00', enabled: true, days: [1, 2, 3, 4, 5, 6, 7] }
                ]);
                await dbConnection.run(
                    'UPDATE settings SET reminders = ? WHERE id = 1',
                    [defaultReminders]
                );
            }

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
