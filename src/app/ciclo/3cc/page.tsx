export const dynamic = 'force-dynamic';

export default function Ciclo3ccHome() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-wide text-head font-semibold mb-2">Comercial</div>
        <h1 className="text-3xl md:text-4xl font-bold text-head">3.º Ciclo Comercial 2026</h1>
        <p className="text-slate4 mt-2">Setembro a Dezembro · em construção</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-head mb-3">Vertentes do 3.º CC</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-head"></span>
              <div>
                <strong>V1 — Velocidade Particulares</strong> (meses 1–2)
                <div className="text-xs text-slate4">MRH · Saúde · VR/PVF (obrigatórios) · Auto DP · Financeiros (facultativos)</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-head"></span>
              <div>
                <strong>V2 — Maratona Empresas</strong> (meses 1–4)
                <div className="text-xs text-slate4">Auto-Frota · MRE · AT · Multicare · PVE · RC · Propriedades Digitais</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-head"></span>
              <div>
                <strong>V3 — Foco Financeiros</strong> (meses 1–4) <span className="text-xs text-green-700">NOVO</span>
                <div className="text-xs text-slate4">Escada por receita processada em Savings &amp; PPR (10k → 700€)</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-head"></span>
              <div>
                <strong>V4 — Diversificação</strong> (meses 3–4) <span className="text-xs text-amber-700">simplificada</span>
                <div className="text-xs text-slate4">10€/venda em Fin (Savings&amp;PPR) · Vida Risco · AP + bónus até 350€</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="border-t border-slate2 pt-4">
          <h3 className="text-sm font-semibold text-head mb-2">Estado da plataforma</h3>
          <p className="text-sm text-slate4">
            O acompanhamento do 3.º CC ainda não está activo. Os ecrãs de Velocidade, Maratona,
            Foco Financeiros, Diversificação, Acompanhamento e Lojas serão publicados em breve, na
            sequência da conclusão do 2.º CC.
          </p>
          <p className="text-xs text-slate4 italic mt-2">
            Enquanto isso, o 2.º Ciclo Comercial continua acessível — usa o botão "↔ trocar para 2.º CC" no topo da página.
          </p>
        </div>
      </div>
    </div>
  );
}
