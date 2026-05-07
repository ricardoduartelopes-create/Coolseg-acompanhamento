import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        head: '#1F3864',
        part: '#DEEBF7',
        emp: '#FCE4D6',
        div: '#E2EFDA',
        total: '#FFE699',
        input: '#FFF7E6',
        incent: '#F4B084',
        link: '#008000',
      },
    },
  },
  plugins: [],
};
export default config;
