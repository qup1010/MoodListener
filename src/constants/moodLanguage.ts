export const describeMoodTemperature = (score: number): string => {
  if (score <= 1.8) return '有点发冷';
  if (score <= 2.6) return '偏冷一些';
  if (score <= 3.4) return '比较平稳';
  if (score <= 4.2) return '正在回暖';
  return '很有活力';
};

export const describeMoodTrend = (delta: number): string => {
  if (delta <= -0.5) return '比上周更低落一点';
  if (delta < -0.15) return '比上周稍微低一点';
  if (delta <= 0.15) return '和上周差不多';
  if (delta < 0.5) return '比上周回暖一些';
  return '比上周明显回暖';
};

export const buildInsightSummary = (recordCount: number, delta: number): string => {
  return `本周有 ${recordCount} 次记录，整体${describeMoodTrend(delta)}`;
};
