/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        bengal: {
          primary: '#1e3a8a', // calm oceanic navy
          accent: '#0d9488', // civic teal
          night: '#1e1b4b', // deep twilight indigo
          warning: '#d97706', // amber caution
          alert: '#dc2626', // emergency red
        }
      },
    },
  },
  plugins: [],
};
