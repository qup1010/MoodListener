export const NOTIFICATION_MESSAGES = {
  morning: [
    '早安，先看看今天的心情要从哪里开始。',
    '新的一天开始了，也别忘了照看一下自己。',
    '给今天一个轻轻的开场，写下此刻的状态吧。',
    '早上的这一分钟，也值得留给自己。'
  ],
  afternoon: [
    '忙了一阵，也可以停一下，听听内心怎么说。',
    '下午好，给现在的情绪一个出口吧。',
    '如果今天有点累，先把感受写下来。',
    '中场休息一下，你现在更接近平静还是紧绷？'
  ],
  evening: [
    '晚上好，把今天轻轻收一收。',
    '在一天结束前，留一句给今天的自己。',
    '夜深之前，先安放一下情绪。',
    '今天过得怎么样？记下来，明天会更清楚。'
  ],
  default: [
    '哪怕只是很小的波动，也值得被看见。',
    '写下来，不是为了评判，而是为了理解自己。',
    '把当下留住，心会更稳一点。',
    'MoodListener 在这里，接住你的此刻。'
  ],
  encouraging: [
    '这两天如果有点难，也没关系，我还在这里。',
    '先别急着变好，先把心情放下来。',
    '如果你今天很辛苦，那就只记录一句也可以。',
    '低落的时候，能停下来照顾自己已经很了不起。'
  ],
  friday: [
    '周五了，替这一周的自己留个小结吧。',
    '这一周快收尾了，看看你是怎么走到今天的。'
  ],
  weekend: [
    '周末到了，今天的心情也值得被认真收下。',
    '慢一点也没关系，周末正适合和自己对话。'
  ]
};

const pickRandom = (items: string[]) => items[Math.floor(Math.random() * items.length)];

const bucketByHour = (hour: number) => {
  if (hour >= 5 && hour < 12) return NOTIFICATION_MESSAGES.morning;
  if (hour >= 12 && hour < 18) return NOTIFICATION_MESSAGES.afternoon;
  if (hour >= 18 || hour < 5) return NOTIFICATION_MESSAGES.evening;
  return NOTIFICATION_MESSAGES.default;
};

export const getIntelligentMessage = (hour: number, date: Date, recentMood?: number | null): string => {
  const day = date.getDay();

  if (day === 5 && Math.random() < 0.45) {
    return pickRandom(NOTIFICATION_MESSAGES.friday);
  }

  if ((day === 0 || day === 6) && Math.random() < 0.45) {
    return pickRandom(NOTIFICATION_MESSAGES.weekend);
  }

  if (typeof recentMood === 'number' && recentMood <= 2.5 && Math.random() < 0.55) {
    return pickRandom(NOTIFICATION_MESSAGES.encouraging);
  }

  const bucket = bucketByHour(hour);
  const merged = Math.random() < 0.3 ? [...bucket, ...NOTIFICATION_MESSAGES.default] : bucket;
  return pickRandom(merged);
};
