import { getDBConnection } from './database';

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

export async function fetchStats(): Promise<StatsData> {
    const db = await getDBConnection();

    // 1. Total Entries
    const countRes = await db.query('SELECT COUNT(*) as count FROM entries');
    const totalEntries = countRes.values?.[0]?.count || 0;

    // 2. Mood Distribution
    const distRes = await db.query(`
        SELECT mood, COUNT(*) as count 
        FROM entries 
        GROUP BY mood
    `);

    const distribution = {
        positive: 0,
        neutral: 0,
        negative: 0,
        positive_percent: 0,
        neutral_percent: 0,
        negative_percent: 0
    };

    if (distRes.values) {
        distRes.values.forEach(row => {
            if (row.mood === 'positive') distribution.positive = row.count;
            if (row.mood === 'neutral') distribution.neutral = row.count;
            if (row.mood === 'negative') distribution.negative = row.count;
        });
    }

    if (totalEntries > 0) {
        distribution.positive_percent = Math.round((distribution.positive / totalEntries) * 100);
        distribution.neutral_percent = Math.round((distribution.neutral / totalEntries) * 100);
        distribution.negative_percent = Math.round((distribution.negative / totalEntries) * 100);
    }

    // 3. Weekly Trend (Last 7 days)
    // Create map for last 7 days
    const trendMap = new Map<string, number>();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        trendMap.set(dateStr, 0);
    }

    const trendRes = await db.query(`
        SELECT date, COUNT(*) as count 
        FROM entries 
        WHERE date >= ? 
        GROUP BY date
    `, [dates[0]]);

    if (trendRes.values) {
        trendRes.values.forEach(row => {
            if (trendMap.has(row.date)) {
                trendMap.set(row.date, row.count);
            }
        });
    }

    const weeklyTrend: WeeklyTrend[] = dates.map(date => ({
        day: date, // Assuming frontend formats it, or we can format to "Mon", "Tue" etc.
        // Backend usually returned specific format? Let's assume date string is fine or check backend.
        // Backend models.py didn't show stats logic. Frontend types: day: string; value: number.
        // Let's return YYYY-MM-DD for now.
        value: trendMap.get(date) || 0
    }));

    // 4. Streak Days
    // Fetch all distinct dates ordered desc
    const datesRes = await db.query('SELECT DISTINCT date FROM entries ORDER BY date DESC');
    let streak = 0;
    if (datesRes.values && datesRes.values.length > 0) {
        const uniqueDates = datesRes.values.map(r => r.date);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if latest is today or yesterday
        let currentIndex = 0;
        if (uniqueDates[0] === today) {
            streak = 1;
            currentIndex = 1;
        } else if (uniqueDates[0] === yesterdayStr) {
            streak = 1;
            currentIndex = 1;
        } else {
            streak = 0;
        }

        if (streak > 0) {
            // Count backwards
            let expectedDate = new Date(uniqueDates[currentIndex - 1]); // today or yesterday

            while (currentIndex < uniqueDates.length) {
                expectedDate.setDate(expectedDate.getDate() - 1);
                const expectedStr = expectedDate.toISOString().split('T')[0];

                if (uniqueDates[currentIndex] === expectedStr) {
                    streak++;
                    currentIndex++;
                } else {
                    break;
                }
            }
        }
    }

    return {
        total_entries: totalEntries,
        streak_days: streak,
        mood_distribution: distribution,
        weekly_trend: weeklyTrend
    };
}
