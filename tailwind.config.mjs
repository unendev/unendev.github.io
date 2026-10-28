import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090d16',
          surface: '#111827',
          card: '#161f33',
          border: '#23304a',
          hover: '#1e293b',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
        pillar: {
          engineering: '#38bdf8',
          ai_universe: '#c084fc',
          narrative: '#fb7185',
          tools: '#34d399',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          'SimSun',
          'STSong',
          'serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: '#cbd5e1',
            lineHeight: '1.8',
            a: {
              color: '#38bdf8',
              textDecoration: 'none',
              '&:hover': {
                color: '#7dd3fc',
                textDecoration: 'underline',
              },
            },
            h1: { color: '#f8fafc', fontWeight: '700' },
            h2: { color: '#f1f5f9', fontWeight: '700', borderBottom: '1px solid #23304a', paddingBottom: '0.4rem' },
            h3: { color: '#e2e8f0', fontWeight: '600' },
            h4: { color: '#cbd5e1', fontWeight: '600' },
            strong: { color: '#f8fafc' },
            code: {
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '0.15rem 0.35rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            blockquote: {
              color: '#94a3b8',
              borderLeftColor: '#38bdf8',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '0 0.5rem 0.5rem 0',
              padding: '0.75rem 1rem',
              fontStyle: 'normal',
            },
            'blockquote p:first-of-type::before': { content: '""' },
            'blockquote p:last-of-type::after': { content: '""' },
            hr: { borderColor: '#23304a' },
            'ul > li::marker': { color: '#38bdf8' },
            'ol > li::marker': { color: '#38bdf8' },
            th: { color: '#f1f5f9' },
            table: { width: '100%' },
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
};
