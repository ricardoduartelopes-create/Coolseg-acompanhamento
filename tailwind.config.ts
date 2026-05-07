import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Tema Coolseg — vermelho cherry + cinzas (ver logo oficial)
        head:      '#DC2740',     // vermelho Coolseg
        headDark:  '#B81F33',     // hover/active
        headLight: '#FBE0E5',     // background suave
        // Tons cinza
        slate1:    '#F7F7F8',
        slate2:    '#EDEDEF',
        slate3:    '#D1D1D5',
        slate4:    '#6E6E73',
        // Realces para tabelas
        part:   '#FBE0E5',
        emp:    '#FAEBE8',
        div:    '#E8EFE6',
        total:  '#F7CCD2',
        input:  '#FFFAFB',
        incent: '#E63A55',
        link:   '#B81F33',
      },
    },
  },
  plugins: [],
};
export default config;
