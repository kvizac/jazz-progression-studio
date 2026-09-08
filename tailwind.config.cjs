module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { glow: '0 0 0 1px rgba(110,231,183,.15), 0 18px 60px rgba(0,0,0,.35)' }
    }
  },
  plugins: [],
};
