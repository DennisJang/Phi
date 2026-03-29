import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#141414',
          surface: '#1A1A1A',
          elevated: '#242424',
        },
        text: {
          primary: '#F5F0E8',
          secondary: '#A09888',
          tertiary: '#6B6156',
        },
        accent: {
          warm: '#D4A574',
          cream: '#F0E6D3',
          ink: '#2C1810',
        },
        interactive: {
          primary: '#7B9EBF',
          hover: '#9BB8D4',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Noto Serif KR', 'serif'],
        sans: ['Inter', 'Pretendard', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      transitionTimingFunction: {
        ceremony: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        micro: '300ms',
        state: '800ms',
        ceremony: '1200ms',
      },
    },
  },
  plugins: [],
};

export default config;
