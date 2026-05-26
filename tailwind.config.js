module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
      extend: {
          fontFamily: {
              sans: ['Inter', 'sans-serif'],
              display: ['Outfit', 'sans-serif'],
          },
          colors: {
              primary: '#f9fafb',
              'on-primary': '#0f172a',
              'accent-green': '#16a34a',
              'accent-green-light': '#dcfce7',
              'accent-blue': '#2563eb',
              'accent-blue-light': '#dbeafe',
              'card-bg': '#ffffff',
              'card-border': '#e5e7eb',
          },
          boxShadow: {
              'premium': '0 10px 40px -10px rgba(22, 163, 74, 0.15)',
          }
      }
  }
}
