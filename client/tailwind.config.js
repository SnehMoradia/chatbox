/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teams: {
          50: '#f3f4fd',
          100: '#e5e7fc',
          200: '#ccd1f9',
          300: '#a7b0f4',
          400: '#7d88ec',
          500: '#5b5fc7', // Signature Teams Blurple
          600: '#4f52b2',
          700: '#44469b',
          800: '#393a80',
          900: '#303168',
        },
        teamsDark: {
          rail: '#18181b',
          sidebar: '#1f1f24',
          chat: '#26262c',
          panel: '#1f1f24',
          card: '#2c2c33',
          cardHover: '#35353d',
          border: '#383842',
          input: '#18181c',
          textMuted: '#9494a3',
        },
        teamsLight: {
          rail: '#ebebeb',
          sidebar: '#f3f2f1',
          chat: '#ffffff',
          panel: '#f8f8f8',
          card: '#ffffff',
          cardHover: '#f5f5f5',
          border: '#e1dfdd',
          input: '#ffffff',
          textMuted: '#616161',
        },
        presence: {
          available: '#107c41',
          busy: '#c4314b',
          dnd: '#c4314b',
          away: '#d83b01',
          offline: '#8a8886',
        }
      },
      boxShadow: {
        'teams-card': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'teams-popover': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
};
