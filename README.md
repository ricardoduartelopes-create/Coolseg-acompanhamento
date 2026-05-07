# Coolseg · Acompanhamento Comercial · 2.º CC 2026

Dashboard web para acompanhamento de incentivos do 2.º Ciclo Comercial 2026.

## Stack

- **Next.js 14** (App Router) com TypeScript
- **Tailwind CSS** para estilo
- **Supabase** (Postgres + Auth)
- **Vercel** para hospedagem

## Estrutura

```
src/
├── app/
│   ├── page.tsx              Resumo (Incentivos consolidados)
│   ├── v1/                   Velocidade Particulares
│   ├── v2/                   Maratona Empresas
│   ├── v3/                   Diversificação
│   ├── lojas/                Detalhe por loja e por colaborador
│   ├── login/                Magic-link login
│   ├── admin/                Importação CRM, entrada manual, objetivos
│   └── api/                  Endpoints de mutação (auth-gated)
├── lib/
│   ├── compute.ts            Cálculos V1/V2/V3 (replica fórmulas Excel)
│   ├── crm-import.ts         Parser do export Crafteer
│   ├── state.ts              Carregamento do estado completo
│   ├── types.ts              Tipos partilhados
│   └── supabase/             Clientes Supabase (browser/server/admin)
└── components/               Componentes reutilizáveis

supabase/migrations/
├── 001_init.sql              Schema (tabelas + RLS)
└── 002_seed.sql              Dados iniciais (lojas, colaboradores, mínimos Fid.)
```

## Desenvolvimento local

```bash
npm install
cp .env.local.example .env.local
# (preencher .env.local com chaves Supabase)
npm run dev
```

Abrir http://localhost:3000.

## Deploy

Ver **DEPLOY.md** para guia passo-a-passo.

## Regras de negócio

- **V1 Sprint Particulares**: patamares 60/80/100/200/250% com gating por nº de variáveis cumpridas; saldo total ≥6 obrigatório
- **V2 Maratona Empresas**: 30€ por bloco de 750€ de receita processada nova (tecto 3000€) + 50% se cumprir objetivo de apólices em ≥2 dos 3 ramos Empresas
- **V3 Diversificação**: escada com retroatividade (8/10€, 12/14€, 16/18€, 18€) + bónus diversidade (15/30/50%) + super-prémio 150€
- **Regra PVF**: cada apólice de PVF (Particulares) conta também para Vida Risco (contagem dupla)

## Importação CRM Crafteer

- UR Entrada > 0 → apólices novas atribuídas ao **Vendedor**
- UR Saída > 0 → anulações atribuídas ao **Gestor**
- Sub-Ramo "Vida" + produto "PROTECÃO VITAL DA FAMÍLIA" → categorizado como PVF
- Sub-Ramo "Vida" outros → Vida Risco
- Demais sub-ramos: Saúde, Acidentes Pessoais (→AP), Multirriscos Habitação (→MRH)

Mapeamento de nomes feito via campo `nome_crm` na tabela `colaboradores`.
