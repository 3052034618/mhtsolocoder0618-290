/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF6EC',
          100: '#F5EBD0',
          200: '#EBD8A1',
          300: '#E0C173',
          400: '#D4A853',
          500: '#C4923A',
          600: '#A3752D',
          700: '#7D5722',
          800: '#583D18',
          900: '#3A2810',
        },
        salon: {
          bg: '#FBF8F3',
          card: '#FFFFFF',
          ink: '#1F2328',
          sub: '#6B6560',
          line: '#EDE8E1',
          pink: '#E8B4B8',
          green: '#2D4A3E',
          rose: '#E8B4B8',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -4px rgba(31, 35, 40, 0.08)',
        'card': '0 1px 3px 0 rgba(31, 35, 40, 0.06), 0 1px 2px -1px rgba(31, 35, 40, 0.04)',
        'glow': '0 0 24px -4px rgba(212, 168, 83, 0.4)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #D4A853 0%, #B8923E 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #F5EBD0 0%, #EBD8A1 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(.2,.9,.3,1.2) both',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,168,83,0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,168,83,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        bounceIn: {
          '0%': { opacity: 0, transform: 'scale(.85)' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
