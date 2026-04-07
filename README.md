# 📱 Nexo-Hub — Sistema de Gestão de Células

Plataforma SaaS moderna para gestão e supervisão de redes de células, com controle hierárquico de acesso (RBAC), interface premium e backend serverless.

**🌐 Produção:** [cellhub-henrique-dev.web.app](https://cellhub-henrique-dev.web.app)

> [!NOTE]
> 📚 Regras de negócio detalhadas em [`REGRAS_DE_NEGOCIO_NEXO.md`](./REGRAS_DE_NEGOCIO_NEXO.md) e o progresso em [`roadmap_producao.md`](./roadmap_producao.md).

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação & Segurança
- **Fluxo Profissional**: Login seguro via E-mail/Senha (Firebase Auth).
- **Onboarding Controlado**: Cadastro exclusivo pela liderança (sem sign-up aberto para evitar spam).
- **Convite por E-mail**: Usuários recebem link de redefinição de senha para configuração de primeiro acesso.
- **Secondary Instance**: Registro de novos usuários via backend/secondary-app sem deslogar o administrador atual.

### 👥 Gestão de Usuários (CRUD)
- **Interface Premium**: Formulários com validação em tempo real e máscaras inteligentes (CEP, Telefone).
- **ID Sequencial**: Cada usuário recebe um código único (ex: `#001`, `#002`) via transação atômica no Firestore.
- **Filtros Avançados**: Busca por nome, e-mail ou código, com filtros de status (Ativo/Inativo/Bloqueado).
- **Segurança de Dados**: Exclusão permitida apenas para contas inativas.

### 📋 Módulo de Relatórios (NOVO 🚀)
- **Relatório Semanal**: Líderes registram presença dos membros, visitantes e anexam foto do encontro.
- **Validação de Frequência**: Trava de segurança para apenas um envio por semana por célula.
- **Visão 360°**: Discipuladores acompanham a saúde da rede através de KPIs de presença média e engajamento.
- **Exportação**: Geração de dados para auditoria e acompanhamento pastoral.

---

## 🏛️ RBAC (Hierarquia de Acesso)

O sistema opera com 4 níveis de permissão, refletindo a estrutura real da organização:

| Papel | Escopo | Permissões Principais |
|:---:|:---:|---|
| **Membro** | Própria Célula | Visualização básica e histórico pessoal |
| **Líder** | Sua Célula | Gestão de membros e envio de relatórios semanais |
| **Discipulador** | Rede de Células | Gestão de líderes, visão consolidada e indicadores da rede |
| **Root** | Global | Controle total, configuração de redes e discipuladores |

---

## 🏗️ Arquitetura Técnica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Backend API** | Node.js + Express (JWT + Admin SDK) |
| **Banco de Dados** | Firebase Firestore |
| **Storage** | Firebase Cloud Storage (Fotos de relatórios) |
| **Estilos** | CSS Vanilla (Design System baseado em Variáveis) |
| **Monitoramento** | Vitest + Playwright (E2E) |

---

## 🛠️ Setup Local

```bash
# 1. Clone o repositório
git clone <repo-url> && cd Nexo-Hub

# 2. Instale as dependências (Raiz e Backend)
npm install
cd backend && npm install && cd ..

# 3. Configuração
# Certifique-se de ter o arquivo backend/serviceAccountKey.json configurado.

# 4. Rodar em Desenvolvimento (Dois Terminais)
# T1: API Backend
cd backend && npm run dev
# T2: React Frontend
npm run dev
```

---

## 🔝 Próximos Passos (Backlog)
- [ ] Dashboard com gráficos interativos (Recharts)
- [ ] Módulo de Eventos e Agenda Ministerial
- [ ] Responsibilidade Mobile completa (PWA)
- [ ] Gestão de estrutra de Redes (CRUD de Redes/Células)

---
*Desenvolvido com foco em excelência operacional e acompanhamento pastoral.*
turo (Produção)
- [ ] Domínio customizado (ex: nexo-hub.com.br)
- [ ] Migrar Firebase config para variáveis de ambiente (.env)
- [ ] PWA (Progressive Web App) com ícone e splash
- [ ] Notificações push (Firebase Cloud Messaging)
- [ ] Separar ambiente dev/staging/prod
- [ ] Remover SeedDevTool em produção
- [ ] Onboarding/tutorial para primeiro acesso do admin
