import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#f0f1f3',
        surface: '#ffffff',
        'surface-alt': '#f7f8f9',
        'surface-hover': '#eef0f2',
        'surface-selected': '#e8f0fe',
        'border-default': '#d4d6da',
        'border-subtle': '#e5e7eb',
        'text-primary': '#1a1d21',
        'text-secondary': '#4b5563',
        'text-muted': '#6b7280',
        accent: {
          DEFAULT: '#0b5fff',
          hover: '#0a4fd6',
          subtle: '#e8f0fe',
        },
        'state-success': '#15803d',
        'state-success-bg': '#f0fdf4',
        'state-danger': '#b91c1c',
        'state-danger-bg': '#fef2f2',
        'state-warning': '#b45309',
        'state-warning-bg': '#fffbeb',
        'flag-active': '#dc2626',
        highlight: '#fef08a',
        'border-focus': '#0b5fff',
        'accent-hover': '#0a4fd6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Noto Serif', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '4xl': ['36px', '40px'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        modal: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        dropdown: '0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
