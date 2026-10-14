import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bluebook: {
          bg: '#f7f7f8',
          surface: '#ffffff',
          border: '#d8dade',
          text: '#1a1a1a',
          muted: '#5b5f66',
          accent: '#0b5fff',
          accentHover: '#0a4fd6',
          flag: '#f5a623',
          correct: '#1f9d55',
          wrong: '#d93a3a',
          warn: '#f5a623',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;