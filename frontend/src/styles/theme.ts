import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';

// Resolve Tailwind config untuk mendapatkan nilai yang telah di-process
const fullConfig = resolveConfig(tailwindConfig);

// Set warna utama dari tema pixel modern
export const colors = {
  // Primary colors
  primary: {
    DEFAULT: '#4B7BEC', // bright blue
    50: '#EEF3FD',
    100: '#D6E2FA',
    200: '#ACC5F6',
    300: '#82A8F1',
    400: '#598BED',
    500: '#4B7BEC', // Default primary
    600: '#3A62D7',
    700: '#294BB3',
    800: '#1D358F',
    900: '#15266B',
    950: '#0D1A4D',
  },
  
  // Secondary colors
  secondary: {
    DEFAULT: '#45AAF2', // light blue
    50: '#ECF6FD',
    100: '#D5EAFB',
    200: '#AAD5F7',
    300: '#80C0F3',
    400: '#55ABEF',
    500: '#45AAF2', // Default secondary
    600: '#3492D9',
    700: '#2479C0',
    800: '#176197',
    900: '#0F4878',
    950: '#0A3256',
  },
  
  // Accent success
  accent: {
    DEFAULT: '#2ECC71', // green
    50: '#E8F9F0',
    100: '#D1F3E1',
    200: '#A3E7C3',
    300: '#74DBA5',
    400: '#46CF87',
    500: '#2ECC71', // Default accent
    600: '#25AF60',
    700: '#1D924F',
    800: '#16743F',
    900: '#0F5C31',
    950: '#0A4123',
  },
  
  // Warning colors
  warning: {
    DEFAULT: '#FFA502', // yellow
    50: '#FFF6E6',
    100: '#FFEDCC',
    200: '#FFDB99',
    300: '#FFC866',
    400: '#FFB633',
    500: '#FFA502', // Default warning
    600: '#E68C00',
    700: '#BF7500',
    800: '#995E00',
    900: '#734700',
    950: '#593600',
  },
  
  // Danger colors
  danger: {
    DEFAULT: '#FF6B6B', // red
    50: '#FFEFEF',
    100: '#FFDFDF',
    200: '#FFBFBF',
    300: '#FF9F9F',
    400: '#FF8080',
    500: '#FF6B6B', // Default danger
    600: '#E65757',
    700: '#BF4545',
    800: '#993636',
    900: '#732828',
    950: '#591F1F',
  },
  
  // Background and text colors
  background: {
    light: '#F1F2F6',
    dark: '#2F3542',
  },
  text: {
    light: '#FFFFFF',
    dark: '#2F3542',
  },
  
  // Additional pixel art colors for UI elements
  pixel: {
    black: '#1A1A1A',
    white: '#FFFFFF',
    outline: '#000000',
    shadow: 'rgba(0, 0, 0, 0.25)',
    highlight: 'rgba(255, 255, 255, 0.85)',
  },
};

// Tipografi untuk tema pixel modern
export const typography = {
  // Nama font yang akan digunakan
  fonts: {
    pixel: '"Press Start 2P", monospace', // Untuk judul dan UI yang lebih pixel
    pixelText: '"VT323", monospace', // Untuk teks pixel yang lebih readable
    sans: 'var(--font-geist-sans), system-ui, sans-serif', // Font non-pixel untuk UI biasa
    mono: 'var(--font-geist-mono), monospace', // Font monospace untuk kode
  },
  
  // Ukuran font
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  
  // Line height untuk teks pixel
  lineHeights: {
    pixel: '1.5', // Untuk font pixel yang lebih tinggi
    normal: '1.5',
    tight: '1.25',
    loose: '2',
  },
  
  // Tracking (letter spacing)
  letterSpacing: {
    pixel: '0.05em', // Sedikit lebih lebar untuk keterbacaan font pixel
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
};

// Shadows untuk efek pixel
export const shadows = {
  pixel: {
    sm: '2px 2px 0 rgba(0, 0, 0, 0.8)',
    md: '3px 3px 0 rgba(0, 0, 0, 0.8)',
    lg: '4px 4px 0 rgba(0, 0, 0, 0.8)',
    inner: 'inset 2px 2px 0 rgba(0, 0, 0, 0.3)',
    highlight: 'inset -1px -1px 0 rgba(255, 255, 255, 0.3)',
    inverted: '-2px -2px 0 rgba(0, 0, 0, 0.8)',
  },
};

// Borders untuk mempertegas tampilan pixel
export const borders = {
  pixel: {
    width: {
      sm: '1px',
      md: '2px',
      lg: '3px',
    },
    radius: {
      none: '0px',
      pixel: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
  },
};

// Animations untuk elemen UI
export const animations = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  timingFunctions: {
    pixel: 'steps(5, end)', // Untuk efek animasi pixel/stepped
    pixelSlow: 'steps(10, end)',
    bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Helper untuk transisi dengan animation preferences
export const getTransition = (
  property: string = 'all', 
  duration: keyof typeof animations.durations = 'normal', 
  timingFunction: keyof typeof animations.timingFunctions = 'smooth',
  delay: string = '0ms'
) => {
  return `${property} ${animations.durations[duration]} ${animations.timingFunctions[timingFunction]} ${delay}`;
};

// Tema untuk komponen umum
export const componentStyles = {
  // Button styles
  button: {
    base: `
      relative 
      py-2 
      px-4 
      inline-flex 
      items-center 
      justify-center 
      font-medium 
      focus:outline-none 
      focus:ring-2 
      focus:ring-offset-2 
      cursor-pointer
      transition-colors
      duration-300
    `,
    pixel: `
      border-2
      border-black
      shadow-[2px_2px_0_rgba(0,0,0,0.8)]
      active:shadow-none
      active:translate-x-[2px]
      active:translate-y-[2px]
      font-pixel
      text-sm
      tracking-wide
    `,
    sizes: {
      xs: 'text-xs py-1 px-2',
      sm: 'text-sm py-1 px-3',
      md: 'text-base py-2 px-4',
      lg: 'text-lg py-3 px-6',
      xl: 'text-xl py-4 px-8',
    },
    variants: {
      primary: `
        bg-primary-500 
        text-white 
        hover:bg-primary-600
        focus:ring-primary-500
      `,
      secondary: `
        bg-secondary-500 
        text-white 
        hover:bg-secondary-600
        focus:ring-secondary-500
      `,
      success: `
        bg-accent-500 
        text-white 
        hover:bg-accent-600
        focus:ring-accent-500
      `,
      warning: `
        bg-warning-500 
        text-white 
        hover:bg-warning-600
        focus:ring-warning-500
      `,
      danger: `
        bg-danger-500 
        text-white 
        hover:bg-danger-600
        focus:ring-danger-500
      `,
      outline: `
        bg-transparent 
        border-2 
        border-primary-500 
        text-primary-500 
        hover:bg-primary-50
        focus:ring-primary-500
      `,
      ghost: `
        bg-transparent 
        text-primary-500 
        hover:bg-primary-50
        focus:ring-primary-500
      `,
      link: `
        bg-transparent 
        text-primary-500 
        hover:underline
        p-0
        shadow-none
        focus:ring-0
      `,
    },
  },
  
  // Card styles
  card: {
    base: `
      bg-white 
      dark:bg-background-dark 
      rounded-md 
      shadow-md 
      overflow-hidden
    `,
    pixel: `
      border-2 
      border-black 
      shadow-[4px_4px_0_rgba(0,0,0,0.8)]
      rounded-pixel-md
    `,
    variants: {
      primary: 'border-l-4 border-l-primary-500',
      secondary: 'border-l-4 border-l-secondary-500',
      success: 'border-l-4 border-l-accent-500',
      warning: 'border-l-4 border-l-warning-500',
      danger: 'border-l-4 border-l-danger-500',
    },
  },
  
  // Input styles
  input: {
    base: `
      block 
      w-full 
      px-3 
      py-2 
      border 
      border-gray-300 
      dark:border-gray-700 
      rounded-md 
      shadow-sm 
      focus:outline-none 
      focus:ring-2 
      focus:ring-primary-500 
      focus:border-primary-500
    `,
    pixel: `
      border-2 
      border-black 
      shadow-inner 
      bg-white 
      dark:bg-gray-800
      px-3 
      py-2 
      font-pixelText
      text-lg
    `,
  },
  
  // Badge styles
  badge: {
    base: `
      inline-flex 
      items-center 
      px-2.5 
      py-0.5 
      rounded-full 
      text-xs 
      font-medium
    `,
    pixel: `
      border 
      border-black 
      px-2 
      py-0.5 
      text-xs 
      font-pixel
      shadow-[1px_1px_0_rgba(0,0,0,0.8)]
    `,
    variants: {
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      success: 'bg-accent-100 text-accent-800',
      warning: 'bg-warning-100 text-warning-800',
      danger: 'bg-danger-100 text-danger-800',
    },
  },
};

// Tema untuk dark mode
export const darkMode = {
  colors: {
    primary: {
      ...colors.primary,
      DEFAULT: '#5D8AEE', // Sedikit lebih cerah di dark mode
    },
    secondary: {
      ...colors.secondary,
      DEFAULT: '#57B4F4', // Sedikit lebih cerah di dark mode
    },
    accent: {
      ...colors.accent,
      DEFAULT: '#40D480', // Sedikit lebih cerah di dark mode
    },
    warning: {
      ...colors.warning,
      DEFAULT: '#FFB133', // Sedikit lebih cerah di dark mode
    },
    danger: {
      ...colors.danger,
      DEFAULT: '#FF8080', // Sedikit lebih cerah di dark mode
    },
    background: '#1A1A24', // Lebih gelap untuk background
  },
  shadows: {
    pixel: {
      ...shadows.pixel,
      sm: '2px 2px 0 rgba(0, 0, 0, 0.9)',
      md: '3px 3px 0 rgba(0, 0, 0, 0.9)',
      lg: '4px 4px 0 rgba(0, 0, 0, 0.9)',
    },
  },
};

// Tema untuk high contrast mode (aksesibilitas)
export const highContrastMode = {
  colors: {
    primary: {
      DEFAULT: '#007AFF',
      50: '#E5F1FF',
      500: '#007AFF',
      900: '#003B7A',
    },
    secondary: {
      DEFAULT: '#00BFFF',
      50: '#E5F8FF',
      500: '#00BFFF',
      900: '#005A7A',
    },
    accent: {
      DEFAULT: '#00D100',
      50: '#E5FFE5',
      500: '#00D100',
      900: '#006300',
    },
    warning: {
      DEFAULT: '#FFD700',
      50: '#FFFBE5',
      500: '#FFD700',
      900: '#7A6700',
    },
    danger: {
      DEFAULT: '#FF0000',
      50: '#FFE5E5',
      500: '#FF0000',
      900: '#7A0000',
    },
    background: {
      light: '#FFFFFF',
      dark: '#000000',
    },
    text: {
      light: '#000000',
      dark: '#FFFFFF',
    },
  },
  borders: {
    pixel: {
      width: {
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
    },
  },
};

// Export theme untuk penggunaan di seluruh aplikasi
export const theme = {
  colors,
  typography,
  shadows,
  borders,
  animations,
  componentStyles,
  darkMode,
  highContrastMode,
  getTransition,
};

export default theme;
