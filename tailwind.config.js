/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#D65DB1',
          coral: '#FF6F91',
          peach: '#FF9671',
        },
        vault: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          elevated: 'var(--color-elevated)',
          secondary: 'var(--color-secondary-surface)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          subtext: 'var(--color-subtext)',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #D65DB1 0%, #FF6F91 50%, #FF9671 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #C24DA0 0%, #EE5E80 50%, #EE8560 100%)',
        'brand-glow': 'radial-gradient(circle at center, rgba(214, 93, 177, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'vault-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
        'vault-md': '0 4px 20px -4px rgba(0, 0, 0, 0.35)',
        'vault-glow': '0 0 25px -5px rgba(214, 93, 177, 0.3)',
      }
    },
  },
  plugins: [],
}
