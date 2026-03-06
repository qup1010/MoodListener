import { fetchSettings, updateSettings } from './services';

export const THEMES = [
    { id: 'classic', name: '经典', primary: '194 148 62', primaryDark: '42 74 76', hex: '#c2943e' },
    { id: 'ocean', name: '海洋', primary: '59 130 246', primaryDark: '30 58 138', hex: '#3b82f6' },
    { id: 'forest', name: '森林', primary: '16 185 129', primaryDark: '6 78 59', hex: '#10b981' },
    { id: 'rose', name: '玫瑰', primary: '244 63 94', primaryDark: '136 19 55', hex: '#f43f5e' },
    { id: 'royal', name: '皇家', primary: '139 92 246', primaryDark: '76 29 149', hex: '#8b5cf6' },
    { id: 'sunset', name: '日落', primary: '249 115 22', primaryDark: '154 52 18', hex: '#f97316' },
];

export interface UIThemeTokens {
    brand: {
        primary: string;
        primaryStrong: string;
    };
    surface: {
        pageLight: string;
        pageDark: string;
        cardLight: string;
        cardDark: string;
    };
    text: {
        primaryLight: string;
        primaryDark: string;
        secondaryLight: string;
        secondaryDark: string;
    };
    accent: {
        subtleLight: string;
        subtleDark: string;
    };
    mood: {
        positive: string;
        neutral: string;
        negative: string;
    };
}

export const BASE_UI_TOKENS: UIThemeTokens = {
    brand: {
        primary: '#c2943e',
        primaryStrong: '#355c5f'
    },
    surface: {
        pageLight: '#f8f7f6',
        pageDark: '#1e1b14',
        cardLight: '#ffffff',
        cardDark: '#28313D'
    },
    text: {
        primaryLight: '#121617',
        primaryDark: '#f5f5f5',
        secondaryLight: '#6b7280',
        secondaryDark: '#9ca3af'
    },
    accent: {
        subtleLight: '#f7f3ea',
        subtleDark: '#2a2a2a'
    },
    mood: {
        positive: '#4ade80',
        neutral: '#facc15',
        negative: '#f87171'
    }
};

export type DarkModeOption = 'light' | 'dark' | 'system';

const normalizeDarkModeOption = (value: string | null | undefined): DarkModeOption => {
    if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
    }
    return 'system';
};

export const initTheme = () => {
    applyUiTokens(BASE_UI_TOKENS);

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

const applyUiTokens = (tokens: UIThemeTokens) => {
    const root = document.documentElement.style;

    root.setProperty('--ui-brand-primary', tokens.brand.primary);
    root.setProperty('--ui-brand-primary-strong', tokens.brand.primaryStrong);

    root.setProperty('--ui-surface-page-light', tokens.surface.pageLight);
    root.setProperty('--ui-surface-page-dark', tokens.surface.pageDark);
    root.setProperty('--ui-surface-card-light', tokens.surface.cardLight);
    root.setProperty('--ui-surface-card-dark', tokens.surface.cardDark);

    root.setProperty('--ui-text-primary-light', tokens.text.primaryLight);
    root.setProperty('--ui-text-primary-dark', tokens.text.primaryDark);
    root.setProperty('--ui-text-secondary-light', tokens.text.secondaryLight);
    root.setProperty('--ui-text-secondary-dark', tokens.text.secondaryDark);

    root.setProperty('--ui-accent-subtle-light', tokens.accent.subtleLight);
    root.setProperty('--ui-accent-subtle-dark', tokens.accent.subtleDark);

    root.setProperty('--ui-mood-positive', tokens.mood.positive);
    root.setProperty('--ui-mood-neutral', tokens.mood.neutral);
    root.setProperty('--ui-mood-negative', tokens.mood.negative);
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
    // CSS token 使用的是 rgb(var(--app-primary))，这里必须写入纯数值三元组
    document.documentElement.style.setProperty('--app-primary', theme.primary);
    document.documentElement.style.setProperty('--app-primary-dark', theme.primaryDark);
};
