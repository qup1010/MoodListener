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
        primary: '#8b6a3f',
        primaryStrong: '#5d4524'
    },
    surface: {
        pageLight: '#f5f0e8',
        pageDark: '#1d1915',
        cardLight: '#fbf6ee',
        cardDark: '#2b241f',
        mutedLight: '#efe7da',
        mutedDark: '#241e19',
        heroLight: '#f2e6d3',
        heroDark: '#312822'
    },
    text: {
        primaryLight: '#2c2c2c',
        primaryDark: '#efe5d6',
        secondaryLight: '#60574c',
        secondaryDark: '#c8bcae'
    },
    border: {
        subtleLight: 'rgba(44, 44, 44, 0.24)',
        subtleDark: 'rgba(239, 229, 214, 0.22)',
        strongLight: 'rgba(44, 44, 44, 0.46)',
        strongDark: 'rgba(239, 229, 214, 0.38)'
    },
    accent: {
        subtleLight: '#ebe0cd',
        subtleDark: '#382f27'
    },
    elevation: {
        card: '3px 3px 0 rgba(44, 44, 44, 0.18), 7px 7px 0 rgba(44, 44, 44, 0.06)',
        hero: '4px 4px 0 rgba(44, 44, 44, 0.22), 10px 10px 0 rgba(44, 44, 44, 0.07)'
    },
    focus: {
        ring: 'rgba(44, 44, 44, 0.16)'
    },
    mood: {
        positive: '#4f8b63',
        neutral: '#b98f31',
        negative: '#b86458'
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
    root.setProperty('--ui-focus-ring', `color-mix(in srgb, ${theme.hex} 18%, transparent)`);
};

