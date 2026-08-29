module.exports = {
  content: ['./frontend/index.html', './frontend/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'console-bg': '#0a0e27',
        'console-text': '#e0e0e0',
        'console-muted': '#8b92a9',
        'console-border': '#2d3142',
        'console-panel': '#151a2f',
        'console-accent': '#00d4ff',
        'console-warn': '#ff6b6b',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
