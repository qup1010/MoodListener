/**
 * 智能通知文案库
 * 根据不同时间段提供温暖的提示语
 */

export const NOTIFICATION_MESSAGES = {
    morning: [
        '早安！新的一天开始了，记录一下此刻的心情吧 ☀️',
        '美好的一天从关注内心开始，你现在感觉如何？',
        '愿你今天充满活力！随手记下当下的感受吧~',
        '早晨的第一缕阳光，和你此刻的心情，都值得被记录。',
        '新的一天，新的开始。此时此刻，你想对自己说什么？',
        '早上好，给今天一个温柔开场：此刻心情是？',
        '出发前，先照顾情绪。写下一句当下感受吧。',
        '今天也请和自己站在同一边。记录一下当前状态。',
        '晨光已到，愿你也被自己看见。',
        '一分钟记录，帮你更清晰地开始这一天。'
    ],
    afternoon: [
        '午后时光，给自己一个小憩的机会，听听内心的声音 ☕',
        '忙碌了一上午，别忘了照顾自己的情绪哦。',
        '下午好！无论此刻心情如何，都值得被接纳和记录。',
        '在忙碌的间隙，花一分钟记录下此刻的感受吧。',
        '愿你的下午充满从容，记得记录下生活中的小确幸。',
        '给疲惫一点出口，也给努力一点肯定。',
        '中场休息一下：现在的你，更接近平静还是焦躁？',
        '把压力写下来，心会轻一点。',
        '无论进展快慢，你都已经在前进。',
        '下午也要记得善待自己，先从觉察情绪开始。'
    ],
    evening: [
        '晚上好！卸下一天的疲惫，记录下今天的感悟吧 🌙',
        '夜深了，和自己对话，整理一下纷乱的思绪。',
        '今天过得怎么样？无论好坏，都已成为过去。',
        '睡前花一点时间，安抚一下自己的情绪吧。',
        '愿你有一个好梦。记录下此刻的心情，也是一种释怀。',
        '给今天一个收尾，也给明天一个更轻松的自己。',
        '把想说的话写在这里，今晚会更安稳。',
        '再忙也辛苦了，先允许自己慢下来。',
        '写下一件值得感谢的小事，让夜晚更柔和。',
        '你已经很努力了，剩下的交给睡眠和时间。'
    ],
    default: [
        '甚至最微小的情绪，也值得被倾听。',
        '只需要一分钟，记录下你现在的感受。',
        '关注内心，是爱自己的第一步。',
        'MoodListener 随时准备倾听你的声音。',
        '给情绪一个出口，给心灵一处栖息。',
        '写下来，不是为了评判，而是为了理解自己。',
        '你可以慢一点，但别忽略自己的感受。',
        '当下这一刻，就是最好的记录时机。',
        '你并不孤单，你正在认真地照顾自己。',
        '先看见情绪，才有机会改变它。'
    ]
};

/**
 * 根据小时获取随机提示语
 * @param hour 0-23
 */
export const getRandomMessage = (hour: number): string => {
    let messages: string[] = [];

    if (hour >= 5 && hour < 12) {
        messages = NOTIFICATION_MESSAGES.morning;
    } else if (hour >= 12 && hour < 18) {
        messages = NOTIFICATION_MESSAGES.afternoon;
    } else if (hour >= 18 || hour < 5) {
        messages = NOTIFICATION_MESSAGES.evening;
    } else {
        messages = NOTIFICATION_MESSAGES.default;
    }

    if (Math.random() < 0.35) {
        messages = [...messages, ...NOTIFICATION_MESSAGES.default];
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};
