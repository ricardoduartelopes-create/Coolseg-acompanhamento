import Link from 'next/link';

export default function Ciclo3ccLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-white border-b border-slate3">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 flex-wrap text-sm">
          <Link href="/" className="px-2 py-1 text-slate4 hover:text-head text-xs">← Início</Link>
          <span className="text-slate3 mx-1">|</span>
          <span className="px-2 py-1 bg-head/10 text-head text-xs rounded font-semibold">3.º CC 2026</span>
          <span className="text-slate3 mx-1">|</span>
          <span className="text-xs text-slate4 italic">Em breve</span>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/ciclo" className="px-2 py-1 text-slate4 hover:text-head text-xs">
              ↔ trocar para 2.º CC
            </Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
