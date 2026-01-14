import { fetchSettings, updateSettings } from './services';

export const THEMES = [
    { id: 'classic', name: '经典', primary: '194 148 62', primaryDark: '42 74 76', hex: '#c2943e' },
    { id: 'ocean', name: '海洋', primary: '59 130 246', primaryDark: '30 58 138', hex: '#3b82f6' },
    { id: 'forest', name: '森林', primary: '16 185 129', primaryDark: '6 78 59', hex: '#10b981' },
    { id: 'rose', name: '玫瑰', primary: '244 63 94', primaryDark: '136 19 55', hex: '#f43f5e' },
    { id: 'royal', name: '皇家', primary: '139 92 246', primaryDark: '76 29 149', hex: '#8b5cf6' },
    { id: 'sunset', name: '日落', primary: '249 115 22', primaryDark: '154 52 18', hex: '#f97316' },
];

// 深色模式选项：'light' | 'dark' | 'system'
export type DarkModeOption = 'light' | 'dark' | 'system';

/**
 * 初始化主题（同步版本，用于首次加载时的快速渲染）
 * 优先从 localStorage 读取
 */
export const initTheme = () => {
    // 深色模式：默认设为 'system'，让初次进入的用户能立刻匹配系统主题
    const darkModeOption = (localStorage.getItem('darkMode') || 'system') as DarkModeOption;
    applyDarkMode(darkModeOption);

    // 移除可能存在的默认类
    document.documentElement.classList.remove('light');

    // 颜色主题
    const savedThemeId = localStorage.getItem('themeId') || 'classic';
    const theme = THEMES.find(t => t.id === savedThemeId) || THEMES[0];
    applyThemeColors(theme);
};

/**
 * 应用深色模式
 */
const applyDarkMode = (option: DarkModeOption) => {
    let isDark = false;

    if (option === 'dark') {
        isDark = true;
    } else if (option === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

/**
 * 从服务层同步主题设置
 * 在应用启动后异步调用，确保与存储层一致
 */
export const syncThemeFromSettings = async () => {
    try {
        const settings = await fetchSettings();

        // 同步深色模式
        const isDark = settings.dark_mode;
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // 同步颜色主题
        const themeId = settings.theme_id || 'classic';
        localStorage.setItem('themeId', themeId);
        const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
        applyThemeColors(theme);
    } catch (error) {
        console.error('同步主题设置失败:', error);
    }
};

/**
 * 切换深色模式（同时保存到存储层）
 */
export const toggleDarkMode = async (option: DarkModeOption) => {
    // 应用深色模式
    applyDarkMode(option);
    localStorage.setItem('darkMode', option);

    // 异步保存到存储层（仅保存 dark_mode 布尔值用于兼容）
    try {
        await updateSettings({ dark_mode: option === 'dark' });
    } catch (error) {
        console.error('保存深色模式设置失败:', error);
    }
};

/**
 * 应用颜色主题（同时保存到存储层）
 */
export const applyTheme = async (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    applyThemeColors(theme);
    localStorage.setItem('themeId', themeId);

    // 异步保存到存储层
    try {
        await updateSettings({ theme_id: themeId });
    } catch (error) {
        console.error('保存主题设置失败:', error);
    }
};

const applyThemeColors = (theme: typeof THEMES[0]) => {
    // Tailwind v4 需要完整的 rgb() 格式
    document.documentElement.style.setProperty('--color-primary', `rgb(${theme.primary})`);
    document.documentElement.style.setProperty('--color-primary-dark', `rgb(${theme.primaryDark})`);
};

