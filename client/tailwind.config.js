/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        qinghe: {
          50: '#F2F6F5',
          100: '#E4F0EC',
          200: '#C9E1DA',
          300: '#A2CCBF',
          400: '#6FB39E',
          500: '#3E9B80',
          600: '#1F8A70',
          700: '#1B7260',
          800: '#175C4E',
          900: '#123F37',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(18, 63, 55, 0.06), 0 4px 14px rgba(18, 63, 55, 0.05)',
      },
    },
  },
  plugins: [],
}
