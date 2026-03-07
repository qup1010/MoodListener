import { fetchSettings, updateSettings } from './services';

export const THEMES = [
    { id: 'forest', name: '森林', primary: '37 176 127', primaryDark: '21 95 78', hex: '#25b07f' },
    { id: 'sand', name: '沙丘', primary: '201 154 90', primaryDark: '127 91 47', hex: '#c99a5a' },
    { id: 'blush', name: '粉雾', primary: '227 143 167', primaryDark: '149 88 112', hex: '#e38fa7' },
    { id: 'peach', name: '蜜桃', primary: '236 156 120', primaryDark: '156 95 68', hex: '#ec9c78' },
    { id: 'ocean', name: '海盐', primary: '93 173 185', primaryDark: '56 104 119', hex: '#5dadb9' },
    { id: 'iris', name: '鸢尾', primary: '138 132 196', primaryDark: '83 79 135', hex: '#8a84c4' },
    { id: 'berry', name: '莓果', primary: '191 103 133', primaryDark: '117 61 82', hex: '#bf6785' }
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
    const theme = THEMES.find((item) => item.id === savedThemeId) || THEMES[0];
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
        localStorage.setItem('mood_icon_pack_id', settings.mood_icon_pack_id || 'playful');
        const theme = THEMES.find((item) => item.id === themeId) || THEMES[0];
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
    const theme = THEMES.find((item) => item.id === themeId) || THEMES[0];
    applyThemeColors(theme);
    localStorage.setItem('themeId', themeId);

    try {
        await updateSettings({ theme_id: themeId });
    } catch (error) {
        console.error('保存主题设置失败:', error);
    }
};

const applyThemeColors = (theme: typeof THEMES[0]) => {
    const root = document.documentElement.style;
    root.setProperty('--app-primary', theme.primary);
    root.setProperty('--app-primary-dark', theme.primaryDark);
    root.setProperty('--ui-brand-primary', theme.hex);
    root.setProperty('--ui-brand-primary-strong', `rgb(${theme.primaryDark})`);
    root.setProperty('--ui-border-strong-light', `color-mix(in srgb, ${theme.hex} 22%, transparent)`);
    root.setProperty('--ui-border-strong-dark', `color-mix(in srgb, ${theme.hex} 30%, transparent)`);
    root.setProperty('--ui-focus-ring', `color-mix(in srgb, ${theme.hex} 24%, transparent)`);
};
