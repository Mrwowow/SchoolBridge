import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef3ff',
          100: '#d9e5ff',
          200: '#bcd0ff',
          300: '#8fb1ff',
          400: '#5b87ff',
          500: '#2F6BFF',   // SchoolBridge blue
          600: '#1a54f0',
          700: '#1341d6',
          800: '#1536ad',
          900: '#163189',
          950: '#111e54',
        },
        surface: {
          DEFAULT: '#F8FAFF',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(47 107 255 / 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
