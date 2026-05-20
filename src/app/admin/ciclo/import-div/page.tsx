import ImportDivForm from './form';
import { loadDashboardState } from '@/lib/state';
import { ramosFor } from '@/lib/types';
export const dynamic = 'force-dynamic';

export default async function ImportDivPage() {
  const s = await loadDashboardState();
  const ramos = ramosFor(s, 'div');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Importar Diversificação</h1>
      <p className="text-sm text-slate4 max-w-2xl">
        Carrega um ficheiro Excel (.xlsx) com a lista de vendas de Diversificação. Cada linha será
        registada como uma apólice da vertente Diversificação (V3) para o colaborador indicado.
      </p>

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold text-head">Formato esperado do ficheiro</h2>
        <p className="text-sm text-slate4">
          A primeira linha deve ser o cabeçalho. Colunas reconhecidas:
        </p>
        <table className="text-xs w-full border border-slate3">
          <thead className="bg-slate2">
            <tr>
              <th className="text-left px-2 py-1.5">Coluna</th>
              <th className="text-left px-2 py-1.5">Obrigatório?</th>
              <th className="text-left px-2 py-1.5">Exemplo / Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate3"><td className="px-2 py-1 font-medium">Colaborador</td><td className="px-2 py-1">Sim</td><td className="px-2 py-1">«Maria Augusta» ou nome completo do CRM «Maria Augusta Faria Lopes»</td></tr>
            <tr className="border-t border-slate3"><td className="px-2 py-1 font-medium">Produto</td><td className="px-2 py-1">Sim</td><td className="px-2 py-1">Um de: <strong>{ramos.join(', ')}</strong></td></tr>
            <tr className="border-t border-slate3"><td className="px-2 py-1 font-medium">Nº Apólice</td><td className="px-2 py-1">Não</td><td className="px-2 py-1">Identificador da apólice no CRM</td></tr>
            <tr className="border-t border-slate3"><td className="px-2 py-1 font-medium">Data</td><td className="px-2 py-1">Não</td><td className="px-2 py-1">Formato AAAA-MM-DD ou data Excel</td></tr>
            <tr className="border-t border-slate3"><td className="px-2 py-1 font-medium">Notas</td><td className="px-2 py-1">Não</td><td className="px-2 py-1">Texto livre</td></tr>
          </tbody>
        </table>
        <p className="text-xs text-slate4">
          Linhas onde o colaborador não for reconhecido ou o produto não for um dos ramos válidos são ignoradas e listadas como «saltadas» depois da importação.
        </p>
      </div>

      <ImportDivForm/>
    </div>
  );
}
