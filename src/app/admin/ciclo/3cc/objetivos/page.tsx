import { load3ccState } from '@/lib/state3cc';
import { ramosFor3cc } from '@/lib/types3cc';
import ObjetivosForm3cc from './form';

export const dynamic = 'force-dynamic';

export default async function Objetivos3ccPage() {
  const s = await load3ccState();
  const ramosPart = ramosFor3cc(s, 'part');
  // Empresas: só os 4 ramos que contam para o cumprimento de ciclo Fidelidade
  // (Multicare · PVE · RC · Propriedades Digitais). Auto Frota/MRE/AT/SEE não
  // têm objectivo individual — só contribuem para a receita processada global.
  const RAMOS_EMP_CICLO = ['Multicare', 'PVE', 'Responsabilidade Civil', 'Propriedades Digitais'];
  const ramosEmp = ramosFor3cc(s, 'emp').filter(r => RAMOS_EMP_CICLO.includes(r));
  const objByKey = new Map(
    s.objetivos_colab.map(o => [`${o.colaborador_id}|${o.tipo}|${o.ramo}`, Number(o.valor)])
  );
  const colabs = s.colaboradores.map(c => ({
    id: c.id, nome: c.nome,
    loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? '',
  }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Objetivos individuais · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Define, por colaborador e ramo, o objetivo individual (menorizado a 40% da grelha
        Fidelidade, mínimo 2 apólices). Para <strong>Financeiros</strong>, o objetivo é receita
        processada em €.
      </p>
      <ObjetivosForm3cc
        colaboradores={colabs}
        ramosPart={ramosPart}
        ramosEmp={ramosEmp}
        objByKey={Object.fromEntries(objByKey)}
      />
    </div>
  );
}
