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
        mutedLight: string;
        mutedDark: string;
        heroLight: string;
        heroDark: string;
    };
    text: {
        primaryLight: string;
        primaryDark: string;
        secondaryLight: string;
        secondaryDark: string;
    };
    border: {
        subtleLight: string;
        subtleDark: string;
        strongLight: string;
        strongDark: string;
    };
    accent: {
        subtleLight: string;
        subtleDark: string;
    };
    elevation: {
        card: string;
        hero: string;
    };
    focus: {
        ring: string;
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
        pageLight: '#f6f1e8',
        pageDark: '#17140f',
        cardLight: '#fffdf8',
        cardDark: '#24211b',
        mutedLight: '#f3ede1',
        mutedDark: '#1f1b15',
        heroLight: '#f4e9d6',
        heroDark: '#201a13'
    },
    text: {
        primaryLight: '#181612',
        primaryDark: '#f7f3ec',
        secondaryLight: '#766b5a',
        secondaryDark: '#b2a58f'
    },
    border: {
        subtleLight: 'rgba(75, 59, 37, 0.10)',
        subtleDark: 'rgba(255, 242, 216, 0.10)',
        strongLight: 'rgba(194, 148, 62, 0.22)',
        strongDark: 'rgba(194, 148, 62, 0.28)'
    },
    accent: {
        subtleLight: '#efe4d0',
        subtleDark: '#2a241c'
    },
    elevation: {
        card: '0 20px 44px -30px rgba(24, 22, 18, 0.28)',
        hero: '0 28px 60px -36px rgba(24, 22, 18, 0.34)'
    },
    focus: {
        ring: 'rgba(194, 148, 62, 0.22)'
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

    const savedThemeId = localStorage.getItem('themeId') || 'forest';
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
    root.setProperty('--ui-surface-muted-light', tokens.surface.mutedLight);
    root.setProperty('--ui-surface-muted-dark', tokens.surface.mutedDark);
    root.setProperty('--ui-surface-hero-light', tokens.surface.heroLight);
    root.setProperty('--ui-surface-hero-dark', tokens.surface.heroDark);

    root.setProperty('--ui-text-primary-light', tokens.text.primaryLight);
    root.setProperty('--ui-text-primary-dark', tokens.text.primaryDark);
    root.setProperty('--ui-text-secondary-light', tokens.text.secondaryLight);
    root.setProperty('--ui-text-secondary-dark', tokens.text.secondaryDark);

    root.setProperty('--ui-border-subtle-light', tokens.border.subtleLight);
    root.setProperty('--ui-border-subtle-dark', tokens.border.subtleDark);
    root.setProperty('--ui-border-strong-light', tokens.border.strongLight);
    root.setProperty('--ui-border-strong-dark', tokens.border.strongDark);

    root.setProperty('--ui-accent-subtle-light', tokens.accent.subtleLight);
    root.setProperty('--ui-accent-subtle-dark', tokens.accent.subtleDark);

    root.setProperty('--ui-elevation-card', tokens.elevation.card);
    root.setProperty('--ui-elevation-hero', tokens.elevation.hero);
    root.setProperty('--ui-focus-ring', tokens.focus.ring);

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

        const themeId = settings.theme_id || 'forest';
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
    document.documentElement.style.setProperty('--app-primary', theme.primary);
    document.documentElement.style.setProperty('--app-primary-dark', theme.primaryDark);
};