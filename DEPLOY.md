# Como pôr o dashboard online — Coolseg · 2.º CC 2026

Guia passo-a-passo. Todas as ferramentas têm planos gratuitos para o nosso volume.

## 0) Resumo

A app é um **Next.js** que vais alojar no **Vercel**. A base de dados e a autenticação ficam no **Supabase**. O código fica num **repositório privado no GitHub**, e o Vercel re-deploy automaticamente sempre que houver alterações.

Tempo estimado: **30 minutos** se for a primeira vez que fazes isto, **10 minutos** se já te orientas.

---

## 1) Criar projecto Supabase

1. Vai a [supabase.com](https://supabase.com) e clica em **Start your project**.
2. Faz login (com Google é o mais rápido).
3. Clica em **New project**.
4. Preenche:
   - **Name**: `coolseg-acompanhamento`
   - **Database Password**: gera uma password forte, guarda-a num gestor de passwords
   - **Region**: `West EU (Frankfurt)`
   - **Pricing Plan**: Free
5. Clica **Create new project** e espera 1-2 minutos.

### 1.1) Correr as migrações SQL

1. No menu lateral do projecto, vai a **SQL Editor** (ícone de base de dados).
2. Clica **+ New query**.
3. Abre o ficheiro `supabase/migrations/001_init.sql` desta pasta, copia tudo e cola no editor.
4. Clica **Run** (canto inferior direito). Deve dizer "Success. No rows returned".
5. Repete o mesmo para `supabase/migrations/002_seed.sql`.

Para confirmar que correu bem: vai a **Table Editor** no menu lateral e verifica que vês as tabelas `lojas`, `colaboradores` (com 21 colaboradores), `apolices`, etc.

### 1.2) Configurar autenticação

1. No menu lateral, vai a **Authentication → Providers**.
2. **Email** deve estar activo (está por defeito). Confirma que **Confirm email** está ON.
3. Vai a **Authentication → URL Configuration**.
4. Em **Site URL** põe (por agora) `http://localhost:3000` — vamos atualizar depois do deploy.
5. Em **Redirect URLs**, adiciona estas duas (uma por linha):
   - `http://localhost:3000/auth/callback`
   - (mais tarde, depois do deploy, vais adicionar o URL Vercel)

### 1.3) Apanhar as chaves

1. No menu lateral, vai a **Project Settings → API**.
2. Copia para um sítio seguro:
   - **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public** key (`eyJhbGc...`)
   - **service_role** key (`eyJhbGc...`) — **mantém secreta**, nunca a metas em código aberto

Cola estas três coisas para mim aqui na conversa e eu valido contigo.

---

## 2) Criar repositório GitHub

1. Vai a [github.com](https://github.com), faz login.
2. Cria um **novo repositório privado** chamado `coolseg-acompanhamento`. Não inicializes com README, .gitignore nem licença.
3. Pega no link do repositório (ex: `https://github.com/teu-user/coolseg-acompanhamento.git`).

### 2.1) Subir o código

Abre o terminal **dentro da pasta `dashboard/`** desta workspace e corre:

```bash
git init
git add .
git commit -m "Versão inicial do dashboard"
git branch -M main
git remote add origin https://github.com/teu-user/coolseg-acompanhamento.git
git push -u origin main
```

(Se nunca usaste `git` na consola, podes usar o **GitHub Desktop** em vez disso — abre a pasta `dashboard/`, *Publish repository*, marca como privado.)

---

## 3) Deploy no Vercel

1. Vai a [vercel.com](https://vercel.com), entra com a conta GitHub.
2. Clica **Add New… → Project**.
3. Selecciona o repositório `coolseg-acompanhamento`.
4. **Framework Preset**: Next.js (deteta automaticamente).
5. **Root Directory**: deixa `./` (a app está na raiz do repo).
6. Antes de clicar Deploy, expande **Environment Variables** e adiciona:

| Nome                              | Valor                            |
|----------------------------------|----------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | (Project URL do Supabase)        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | (anon key do Supabase)           |
| `SUPABASE_SERVICE_ROLE_KEY`      | (service_role key — secreta)     |
| `ALLOWED_ADMIN_EMAILS`           | `duarte.lopes@coolseg.pt`        |

7. Clica **Deploy** e espera 1-2 minutos. Vais ter um URL tipo `coolseg-acompanhamento-xxxx.vercel.app`.

### 3.1) Atualizar a URL no Supabase

Volta ao Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://coolseg-acompanhamento-xxxx.vercel.app` (o URL que o Vercel te deu)
- Em **Redirect URLs**, adiciona: `https://coolseg-acompanhamento-xxxx.vercel.app/auth/callback`

Guarda.

---

## 4) Primeiro login

1. Abre o teu URL Vercel.
2. Clica em **Entrar** (canto superior direito).
3. Escreve `duarte.lopes@coolseg.pt` e clica **Enviar link**.
4. Vai ao email, clica no link de magic-link. Entras no dashboard como admin.

---

## 5) Configuração inicial

Uma vez logado:

1. Vai a **Admin → Objetivos & Receita** e preenche os objetivos por colaborador (Particulares + Empresas) e os totais Coolseg.
2. Vai a **Admin → Importar do CRM** e carrega o ficheiro `.xls` mais recente do Crafteer.
3. Confere os dashboards públicos (Resumo, Velocidade, Maratona, Diversificação).

---

## 6) Como atualizar daqui para a frente

**Para importar dados novos do CRM**: Admin → Importar do CRM, carrega o `.xls`. Cada importação é incremental — não duplica os dados antigos, mas **também não os apaga**. Se quiseres começar do zero, primeiro vai a Admin → Apólices lançadas e remove tudo.

**Para corrigir uma apólice**: Admin → Apólices lançadas → `remover`. Para acrescentar uma manual: Admin → Adicionar apólice.

**Para ajustar objetivos**: Admin → Objetivos & Receita → editar valores → Guardar.

**Para o código**: qualquer alteração que façamos numa próxima sessão, basta fazer `git push` que o Vercel faz re-deploy sozinho.

---

## Notas

- **Custo**: tudo gratuito (Vercel hobby + Supabase Free). Suporta facilmente o teu volume.
- **Domínio próprio**: se quiseres `acompanhamento.coolseg.pt`, vai ao Vercel → Project → Settings → Domains, adiciona-o e segue as instruções de DNS.
- **Backup**: o Supabase faz backups automáticos no plano Free (7 dias retenção). Para mais segurança, podemos automatizar exports diários para um Google Drive.
- **Adicionar mais admins**: edita a env var `ALLOWED_ADMIN_EMAILS` no Vercel (separados por vírgula) e re-deploy.
