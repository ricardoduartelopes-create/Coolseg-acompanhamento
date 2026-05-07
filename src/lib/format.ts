export const fmtEUR = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
export const fmtNum = (n: number) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(n);
export const fmtPct = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'percent', maximumFractionDigits: 1 }).format(n);
