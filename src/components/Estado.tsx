// Pílula de estado (✓ Cumprido / Quase / Em curso / —)
export function Estado({ realizado, objetivo }: { realizado: number; objetivo: number }) {
  if (!objetivo || objetivo === 0) return <span className="text-gray-400">—</span>;
  const r = realizado / objetivo;
  if (realizado >= objetivo)
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">✓ Cumprido</span>;
  if (r >= 0.8)
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Quase</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Em curso</span>;
}
