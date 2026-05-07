import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Tema Coolseg / Fidelidade — vermelho sóbrio + cinzas + branco
        head: '#B22234',          // vermelho Coolseg (sóbrio, não muito carregado)
        headDark: '#8B1A28',      // vermelho mais escuro para contraste
        headLight: '#E8C5CB',     // tom suave (fundo de tabela)
        // Tons cinza
        slate1: '#F7F7F8',        // fundo geral
        slate2: '#EDEDEF',        // linhas alternadas
        slate3: '#D1D1D5',        // separadores
        slate4: '#6E6E73',        // texto secundário
        // Realces para tabelas (mantidos para legibilidade)
        part:   '#F2E5E7',        // fundo Particulares (rosa muito suave)
        emp:    '#FAEBE8',        // fundo Empresas (pêssego suave)
        div:    '#E8EFE6',        // fundo Diversificação (cinza-verde suave)
        total:  '#F4D4D8',        // fundo Total (rosa)
        input:  '#FFF8F8',        // fundo de input (quase branco)
        incent: '#E89AA1',        // fundo de incentivo (vermelho-rosa)
        link:   '#8B1A28',        // links → vermelho-escuro Coolseg
      },
    },
  },
  plugins: [],
};
export default config;
