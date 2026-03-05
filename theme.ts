import { fetchSettings, updateSettings } from './services';

export const THEMES = [
    { id: 'classic', name: '经典', primary: '194 148 62', primaryDark: '42 74 76', hex: '#c2943e' },
    { id: 'ocean', name: '海洋', primary: '59 130 246', primaryDark: '30 58 138', hex: '#3b82f6' },
    { id: 'forest', name: '森林', primary: '16 185 129', primaryDark: '6 78 59', hex: '#10b981' },
    { id: 'rose', name: '玫瑰', primary: '244 63 94', primaryDark: '136 19 55', hex: '#f43f5e' },
    { id: 'royal', name: '皇家', primary: '139 92 246', primaryDark: '76 29 149', hex: '#8b5cf6' },
    { id: 'sunset', name: '日落', primary: '249 115 22', primaryDark: '154 52 18', hex: '#f97316' },
];

export type DarkModeOption = 'light' | 'dark' | 'system';

const normalizeDarkModeOption = (value: string | null | undefined): DarkModeOption => {
    if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
    }
    return 'system';
};

export const initTheme = () => {
    const darkModeOption = normalizeDarkModeOption(localStorage.getItem('darkMode'));
    applyDarkMode(darkModeOption);

    document.documentElement.classList.remove('light');

    const savedThemeId = localStorage.getItem('themeId') || 'classic';
    const theme = THEMES.find(t => t.id === savedThemeId) || THEMES[0];
    applyThemeColors(theme);
};

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

export const syncThemeFromSettings = async () => {
    try {
        const settings = await fetchSettings();

        const optionFromSettings = settings.dark_mode_option;
        const effectiveOption: DarkModeOption = optionFromSettings === 'light' || optionFromSettings === 'dark' || optionFromSettings === 'system'
            ? optionFromSettings
            : (settings.dark_mode ? 'dark' : 'light');

        localStorage.setItem('darkMode', effectiveOption);
        applyDarkMode(effectiveOption);

        const themeId = settings.theme_id || 'classic';
        localStorage.setItem('themeId', themeId);
        const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
        applyThemeColors(theme);
    } catch (error) {
        console.error('同步主题设置失败:', error);
    }
};

export const toggleDarkMode = async (option: DarkModeOption) => {
    applyDarkMode(option);
    localStorage.setItem('darkMode', option);

    try {
        await updateSettings({
            dark_mode: option === 'dark',
            dark_mode_option: option
        });
    } catch (error) {
        console.error('保存深色模式设置失败:', error);
    }
};

export const applyTheme = async (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    applyThemeColors(theme);
    localStorage.setItem('themeId', themeId);

    try {
        await updateSettings({ theme_id: themeId });
    } catch (error) {
        console.error('保存主题设置失败:', error);
    }
};

const applyThemeColors = (theme: typeof THEMES[0]) => {
    document.documentElement.style.setProperty('--app-primary', `rgb(${theme.primary})`);
    document.documentElement.style.setProperty('--app-primary-dark', `rgb(${theme.primaryDark})`);
};


