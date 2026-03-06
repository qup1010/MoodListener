export interface QuoteItem {
  text: string;
  author: string;
}

export const HOME_QUOTES: QuoteItem[] = [
  { text: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '你若盛开，蝴蝶自来；你若精彩，天自安排。', author: '佚名' },
  { text: '不要因为走得太远，而忘记为什么出发。', author: '纪伯伦' },
  { text: '生命中最困难的时刻，往往是最接近转机的时刻。', author: '佚名' },
  { text: '做你自己，因为别人都有人做了。', author: '奥斯卡·王尔德' },
  { text: '今天的努力是为了将来更好的自己。', author: '佚名' },
  { text: '每一天都是一个新的开始，不要让昨天的阴影遮住今天的阳光。', author: '佚名' },
  { text: '心若向阳，无畏悲伤。', author: '佚名' },
  { text: '不管前方的路有多苦，只要走的方向正确，一切都会变得柔和。', author: '宫崎骏' },
  { text: '慢一点也没关系，你并没有落后，只是在走自己的节奏。', author: '佚名' },
  { text: '你认真生活的样子，本身就很闪亮。', author: '佚名' },
  { text: '允许自己偶尔脆弱，也是在练习真正的强大。', author: '佚名' },
  { text: '把今天过好，就是对未来最稳妥的投资。', author: '佚名' },
  { text: '愿你在平凡日常里，也能看见细小而确定的幸福。', author: '佚名' },
  { text: '先接纳当下，再慢慢变好。', author: '佚名' },
  { text: '你已经比昨天更懂自己，这很了不起。', author: '佚名' },
  { text: '允许不完美，才有持续前进的空间。', author: '佚名' },
  { text: '再小的进步，也值得被看见和庆祝。', author: '佚名' },
  { text: '真正的勇敢，是在不确定里依然选择向前。', author: '佚名' },
  { text: '把注意力放回自己，你会重新长出力量。', author: '佚名' },
  { text: '今天辛苦了，给自己一点温柔。', author: '佚名' },
  { text: '你不是情绪本身，你是能够看见情绪的人。', author: '佚名' },
  { text: '慢慢来，答案会在行动里出现。', author: '佚名' }
];

export const homeCopy = {
  heroEyebrow: '今日状态',
  heroSupporting: '让今天的情绪被好好看见。',
  heroAction: '开始记录',
  streakLabel: '连续记录',
  totalLabel: '总记录数',
  defaultSummary: '今天先用一条快速笔记开始。',
  streakSummary: (days: number) => `你已连续记录 ${days} 天，节奏很好。`,
  totalSummary: (count: number) => `你已记录 ${count} 条，继续保持。`,
  insightTitle: '每周洞察',
  insightRefresh: '刷新',
  insightRefreshing: '刷新中...',
  insightLoadingTitle: '正在整理本周节奏',
  insightLoadingBody: '稍等一下，我把最近 7 天的变化压缩成一张卡片。',
  insightEmptyKey: '待解锁',
  insightEmptyLabel: '每周节奏',
  insightEmptySupporting: '再写几条记录，趋势就会慢慢清晰。',
  quoteTitle: '今日一句',
  quoteAction: '点一下换一句',
  headerSupport: '今天也照顾好自己。'
};

export const emptyStateCopy = {
  historyTitle: '还没有记录',
  historyBody: '先记下一次情绪，回顾会慢慢长出来。',
  historyAction: '开始记录',
  historySearchEmpty: '没有找到匹配记录',
  trendLocked: (remaining: number) => `再记录 ${remaining} 条，就能解锁趋势。`,
  trendUnlockedHint: '记录越稳定，变化越容易看清。',
  statsNoActivities: '先记录几次活动，常见触发因素会出现在这里。'
};

export const recordCopy = {
  title: '快速记录',
  subtitle: '先选情绪，再补一两个活动就够了。',
  moodPrompt: '你现在感觉怎么样？',
  activityTitle: '活动',
  recentActivityTitle: '最近常用',
  quickNoteTitle: '快速笔记',
  quickNotePlaceholder: '写下一句话，给此刻留个标记...',
  openFullNote: '打开完整注释',
  extrasTitle: '更多选项',
  extrasClosedHint: '位置、照片等可选内容',
  extrasLocationDone: '已填写位置',
  extrasImageCount: (count: number) => `已添加 ${count} 张图片`,
  locationLabel: '位置（可选）',
  locationPlaceholder: '例如：公司、家里、地铁',
  imagesLabel: '照片（可选）',
  addImage: '添加照片',
  imageUploading: '上传中...',
  backConfirmTitle: '放弃当前记录？',
  backConfirmMessage: '草稿尚未保存，是否离开？',
  backConfirmLeave: '离开',
  backConfirmStay: '继续编辑',
  save: '保存',
  saving: '保存中...',
  saveSuccess: '记录已保存'
};

export const statsCopy = {
  title: '统计分析',
  subtitle: '把波动压缩成几条容易理解的线索。',
  summaryTitle: '最近状态',
  totalEntries: '总记录',
  streakDays: '连续天数',
  averageMood7d: '7天均分',
  averageMood30d: '30天均分',
  trendTitle: '记录趋势',
  distributionTitle: '5级情绪分布',
  activityTitle: '高频活动',
  noTrend: '先保持几天记录，趋势会比空白更有意义。',
  noData: '还没有足够的数据'
};

export const ENTRY_PROMPTS: string[] = [
  '今天哪一个瞬间最触动你？',
  '你现在最强烈的感受是什么？',
  '这份情绪背后，藏着怎样的需求？',
  '今天最想感谢的人或事是什么？',
  '如果给此刻起一个标题，会是什么？',
  '发生了什么，让你产生了这种心情？',
  '你希望明天的自己看到这条记录时，记住什么？',
  '今天最想对自己说的一句话是？',
  '这份情绪在身体上有什么感觉？',
  '为了让自己好一点点，你准备做什么？',
  '今天有没有一个被你忽略的小确幸？',
  '你现在最想被理解的部分是什么？',
  '此刻你的内心更需要休息、行动还是陪伴？',
  '如果把烦恼缩小 10%，你会先做哪一步？',
  '今天最让你骄傲的一件小事是什么？'
];