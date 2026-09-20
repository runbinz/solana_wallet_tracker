import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'page-bg': 'var(--page-bg)',
        'surface': 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-soft': 'var(--surface-soft)',
        'surface-strong': 'var(--surface-strong)',
        'nav-bg': 'var(--nav-bg)',
        'nav-border': 'var(--nav-border)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: {
          purple: '#9945FF',
          violet: '#8B5CF6',
          lavender: '#A78BFA',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'glow-purple': '0 0 40px -8px var(--glow-purple)',
        'glow-secondary': '0 0 40px -8px var(--glow-secondary)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        'sm': '0.125rem',
        'md': '0.25rem',
        'lg': '0.375rem',
        'xl': '0.5rem',
        '2xl': '0.5rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
