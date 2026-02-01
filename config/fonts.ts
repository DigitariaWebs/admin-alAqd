import { DM_Sans } from 'next/font/google';

// DM Sans from Google Fonts as the primary font
export const fontPrimary = DM_Sans({
    variable: '--font-dm-sans',
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
});

// Re-export as standard Fonts object
export const Fonts = {
    primary: fontPrimary,
};

// Also export individual fonts for layout usage
export const fontSecondary = fontPrimary; // Fallback or alias if needed
