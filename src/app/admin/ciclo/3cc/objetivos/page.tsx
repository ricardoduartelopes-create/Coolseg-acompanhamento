import { load3ccState } from '@/lib/state3cc';
import { ramosFor3cc } from '@/lib/types3cc';
import ObjetivosForm3cc from './form';

export const dynamic = 'force-dynamic';

export default async function Objetivos3ccPage() {
  const s = await load3ccState();
  const ramosPart = ramosFor3cc(s, 'part');
  // Empresas: só os 4 ramos que contam para cumprimento de ciclo Fidelidade
  const RAMOS_EMP_CICLO = ['Multicare', 'PVE', 'Responsabilidade Civil', 'Propriedades Digitais'];
  const ramosEmp = ramosFor3cc(s, 'emp').filter(r => RAMOS_EMP_CICLO.includes(r));

  const objByKey = new Map(
    s.objetivos_colab.map(o => [`${o.colaborador_id}|${o.tipo}|${o.ramo}`, Number(o.valor)])
  );
  const colabs = s.colaboradores.map(c => ({
    id: c.id, nome: c.nome,
    loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? '',
  }));

  const objCoolseg = s.objetivos_coolseg.map(o => ({ metric: o.metric, valor: Number(o.valor) }));
  const realCoolseg = s.realizado_coolseg.map(o => ({ metric: o.metric, valor: Number(o.valor) }));
  const minFid = s.min_fidelidade.map(m => ({
    id: m.id, tipo: m.tipo, ramo: m.ramo ?? '', metric: m.metric ?? '', valor: Number(m.valor),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Objetivos & Referências · 3.º CC</h1>
      <p className="text-sm text-slate4">
        4 tabs: objectivos por colab (Particulares + Empresas), totais Coolseg, e mínimos Fidelidade.
      </p>
      <ObjetivosForm3cc
        colaboradores={colabs}
        ramosPart={ramosPart}
        ramosEmp={ramosEmp}
        objByKey={Object.fromEntries(objByKey)}
        objCoolseg={objCoolseg}
        realCoolseg={realCoolseg}
        minFid={minFid}
      />
    </div>
  );
}
