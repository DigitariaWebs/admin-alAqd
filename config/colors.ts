export const Colors = {
    primary: {
        main: '#52101b', // User specified primary
        light: '#833941',
        dark: '#2b0000',
        50: '#fceef0',
        100: '#f7dcd1',
        200: '#efbba6',
        300: '#e59082',
        400: '#d76161',
        500: '#52101b',
        600: '#460d16',
        700: '#390a11',
        800: '#2d070d',
        900: '#200508',
    },
    secondary: {
        main: '#D4A574', // Warm gold
        light: '#E8C9A8',
        dark: '#A67C4A',
        50: '#FDF8F3',
        100: '#F8EDE2',
        200: '#F0D9C5',
        300: '#E8C9A8',
        400: '#D4A574',
        500: '#C9944F',
        600: '#A67C4A',
        700: '#8B673D',
        800: '#704F30',
        900: '#5A3F27',
    },
    accent: {
        main: '#BE185D',
        light: '#EC4899',
        dark: '#9D174D',
    },
    neutral: {
        white: '#FFFFFF',
        black: '#000000',
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#E5E5E5',
        300: '#D4D4D4',
        400: '#A3A3A3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
    },
    semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },
    background: {
        primary: '#FFFFFF',
        secondary: '#FAFAFA',
        tertiary: '#F5F5F5',
    },
    text: {
        primary: '#171717',
        secondary: '#525252',
        tertiary: '#737373',
        disabled: '#A3A3A3',
        inverse: '#FFFFFF',
    },
    border: {
        light: '#E5E5E5',
        medium: '#D4D4D4',
        dark: '#A3A3A3',
        focus: '#52101b', // Primary main
    },
} as const;

export type ColorsType = typeof Colors;
