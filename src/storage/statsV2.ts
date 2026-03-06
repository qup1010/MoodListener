import { getDBConnection } from './database';
import { MoodScore } from '../../types';
import { toLocalDateString } from '../utils/date';

export interface MoodScoreDistributionItem {
    score: MoodScore;
    count: number;
    percent: number;
}

export interface ActivityFrequencyItem {
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
    mood_distribution: MoodScoreDistributionItem[];
    top_activities: ActivityFrequencyItem[];
    trend_7d: TrendPointV2[];
    trend_30d: TrendPointV2[];
}

const listRecentDates = (days: number): string[] => {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const next = new Date();
        next.setDate(next.getDate() - i);
        dates.push(toLocalDateString(next));
    }
    return dates;
};

const calculateStreak = (sortedDatesDesc: string[]): number => {
    if (sortedDatesDesc.length === 0) return 0;

    const today = toLocalDateString(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toLocalDateString(yesterdayDate);

    if (sortedDatesDesc[0] !== today && sortedDatesDesc[0] !== yesterday) {
        return 0;
    }

    let streak = 1;
    let expected = new Date(sortedDatesDesc[0]);

    for (let i = 1; i < sortedDatesDesc.length; i++) {
        expected.setDate(expected.getDate() - 1);
        const expectedStr = toLocalDateString(expected);
        if (sortedDatesDesc[i] !== expectedStr) {
            break;
        }
        streak += 1;
    }

    return streak;
};

const calculateAverageMood = (rows: Array<{ mood_score: number }>): number => {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, row) => sum + Number(row.mood_score || 0), 0);
    return Number((total / rows.length).toFixed(2));
};

const buildDistribution = (rows: Array<{ mood_score: number; count: number }>, total: number): MoodScoreDistributionItem[] => {
    const scoreMap = new Map<MoodScore, number>([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0]
    ]);

    for (const row of rows) {
        const score = Number(row.mood_score) as MoodScore;
        if (scoreMap.has(score)) {
            scoreMap.set(score, Number(row.count || 0));
        }
    }

    return ([5, 4, 3, 2, 1] as MoodScore[]).map((score) => {
        const count = scoreMap.get(score) || 0;
        return {
            score,
            count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });
};

const buildTrend = (
    sourceRows: Array<{ date: string; count: number; avg_mood: number }>,
    dates: string[]
): TrendPointV2[] => {
    const map = new Map<string, { count: number; avg_mood: number }>();

    for (const row of sourceRows) {
        map.set(row.date, {
            count: Number(row.count || 0),
            avg_mood: Number(row.avg_mood || 0)
        });
    }

    return dates.map((day) => {
        const found = map.get(day);
        return {
            day,
            entryCount: found?.count || 0,
            avgMood: Number((found?.avg_mood || 0).toFixed(2))
        };
    });
};

export async function fetchStatsV2(): Promise<StatsV2> {
    const db = await getDBConnection();

    const [totalRes, distRes, uniqueDatesRes] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM entries_v2'),
        db.query('SELECT mood_score, COUNT(*) as count FROM entries_v2 GROUP BY mood_score'),
        db.query('SELECT DISTINCT date FROM entries_v2 ORDER BY date DESC')
    ]);

    const totalEntries = Number(totalRes.values?.[0]?.count || 0);
    const moodDistribution = buildDistribution((distRes.values || []) as Array<{ mood_score: number; count: number }>, totalEntries);

    const uniqueDates = (uniqueDatesRes.values || []).map((row) => String(row.date));
    const streakDays = calculateStreak(uniqueDates);

    const recent7Start = listRecentDates(7)[0];
    const recent30Start = listRecentDates(30)[0];

    const [avg7Rows, avg30Rows, topActivitiesRes, trend7Res, trend30Res] = await Promise.all([
        db.query('SELECT mood_score FROM entries_v2 WHERE date >= ?', [recent7Start]),
        db.query('SELECT mood_score FROM entries_v2 WHERE date >= ?', [recent30Start]),
        db.query(
            `SELECT a.id as activity_id, a.name, COUNT(*) as count
             FROM entry_activities ea
             JOIN activities a ON a.id = ea.activity_id
             JOIN entries_v2 e ON e.id = ea.entry_id
             GROUP BY a.id, a.name
             ORDER BY count DESC, a.id ASC
             LIMIT 5`
        ),
        db.query(
            `SELECT date, COUNT(*) as count, AVG(mood_score) as avg_mood
             FROM entries_v2
             WHERE date >= ?
             GROUP BY date
             ORDER BY date ASC`,
            [recent7Start]
        ),
        db.query(
            `SELECT date, COUNT(*) as count, AVG(mood_score) as avg_mood
             FROM entries_v2
             WHERE date >= ?
             GROUP BY date
             ORDER BY date ASC`,
            [recent30Start]
        )
    ]);

    const topActivities = (topActivitiesRes.values || []).map((row) => {
        const count = Number(row.count || 0);
        return {
            activity_id: row.activity_id,
            name: row.name,
            count,
            ratioPercent: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0
        };
    });

    return {
        total_entries: totalEntries,
        streak_days: streakDays,
        average_mood_7d: calculateAverageMood((avg7Rows.values || []) as Array<{ mood_score: number }>),
        average_mood_30d: calculateAverageMood((avg30Rows.values || []) as Array<{ mood_score: number }>),
        mood_distribution: moodDistribution,
        top_activities: topActivities,
        trend_7d: buildTrend((trend7Res.values || []) as Array<{ date: string; count: number; avg_mood: number }>, listRecentDates(7)),
        trend_30d: buildTrend((trend30Res.values || []) as Array<{ date: string; count: number; avg_mood: number }>, listRecentDates(30))
    };
}
