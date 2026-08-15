import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#201D19',
        paper: '#FAF6EF',
        rust: { DEFAULT: '#A8552E', dark: '#7E3E20' },
        sage: '#5B6E4F',
        ochre: '#B4862B',
        teal: '#2C4A46',
        line: '#DDD3C2',
        soft: '#F1EADC',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
      borderRadius: {
        card: '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
