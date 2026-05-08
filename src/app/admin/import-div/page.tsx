import ImportDivForm from './form';
export const dynamic = 'force-dynamic';

export default async function ImportDivPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Importar Diversificação</h1>
      <p className="text-sm text-slate4 max-w-2xl">
        Carrega o <strong>mesmo ficheiro Crafteer</strong> que usas no Velocidade. O sistema percorre as apólices
        e cria automaticamente os registos de V3 (Diversificação) para as que se enquadrem nas regras abaixo.
      </p>

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold text-head">Regras de classificação</h2>
        <ul className="text-sm text-slate4 list-disc list-inside space-y-1">
          <li><strong>Multicare</strong>: Sub-Ramo «Saúde» + produto contém «MULTICARE»</li>
          <li><strong>Vida Risco</strong>: Sub-Ramo «Vida» (inclui PVF e produtos Vida Risco puros)</li>
          <li><strong>Financeiros</strong>: produto contém «PPR», «POUPANÇA» ou «FINANCEIRO»</li>
        </ul>
        <p className="text-xs text-slate4">
          Linhas que não se enquadrem em nenhuma regra são ignoradas silenciosamente (não são erros — apenas não fazem parte da Diversificação).
          UR Entrada {`>`} 0 cria registos para o Vendedor; UR Saída é ignorada (V3 conta apenas vendas).
        </p>
      </div>

      <ImportDivForm/>
    </div>
  );
}
