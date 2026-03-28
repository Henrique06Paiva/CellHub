# 📱 Nexo-Hub — Sistema de Gestão de Células

Plataforma SaaS moderna para gestão e supervisão de redes de células, com controle hierárquico de acesso (RBAC), interface premium e backend serverless.

**🌐 Produção:** [cellhub-henrique-dev.web.app](https://cellhub-henrique-dev.web.app)

> 📚 Regras de negócio detalhadas em [`REGRAS_DE_NEGOCIO_NEXO.md`](./REGRAS_DE_NEGOCIO_NEXO.md)

---

## ✨ Funcionalidades Implementadas

### Autenticação & Segurança
- ✅ Login via E-mail/Senha (Firebase Auth)
- ✅ Cadastro exclusivamente pela liderança (sem sign-up aberto)
- ✅ Primeiro acesso via e-mail de redefinição de senha
- ✅ Instância secundária do Firebase para registro sem deslogar admin
- ✅ Esqueceu a senha funcional com `sendPasswordResetEmail`

### Gestão de Usuários (CRUD completo)
- ✅ Formulário premium: validação em tempo real, máscaras (CEP, telefone)
- ✅ **ID Sequencial**: cada usuário recebe um código único (`#001`, `#002`...) via Firestore Transaction atômica
- ✅ Busca por nome, e-mail ou código do usuário
- ✅ Filtros por status (Ativo / Inativo / Bloqueado)
- ✅ Exclusão segura apenas de contas inativas
- ✅ Paginação na listagem

### RBAC (4 Níveis de Acesso)
| Papel | Escopo | Permissões |
|---|---|---|
| **Membro** | Própria célula | Visualização apenas |
| **Líder** | Sua célula | Gestão de membros, relatórios de presença |
| **Discipulador** | Rede de células | Gestão de líderes, membros e visão consolidada |
| **Root** | Plataforma inteira | Estrutura de redes, discipuladores e configurações globais |

### Interface
- ✅ Dark theme premium (Glassmorphism + CSS Variables)
- ✅ Sidebar responsiva com collapse/expand
- ✅ Dropdown de perfil no header
- ✅ Animações e micro-interações
- ✅ Tabela de dados com zebra-striping e paginação
- ✅ Módulos futuros pré-sinalizados (Relatórios, Eventos)

### Ferramenta Dev (SeedDevTool)
- ✅ Injeta dados mockados no Firestore para teste
- ✅ Opções: Tornar-se Líder ou Discipulador com células e membros de teste

---

## 🏗️ Arquitetura Técnica

### Stack
| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Backend** | Firebase (Auth, Firestore, Storage, Hosting) |
| **Estilo** | CSS Vanilla (Variables, Flexbox, Animations) |
| **Ícones** | Lucide React |
| **Routing** | React Router DOM 7 |

### Estrutura do Projeto
```
src/
├── App.jsx                    # Router principal + ProtectedRoutes
├── main.jsx                   # Entry point
├── index.css                  # Design system (CSS Variables + Global)
├── contexts/
│   └── AuthContext.jsx        # Auth state, login, cadastro admin, RBAC
├── lib/
│   └── firebase.js            # Configuração e exports do Firebase SDK
├── components/
│   ├── Layout/
│   │   └── DashboardLayout.jsx  # Sidebar + Header + Outlet
│   └── SeedDevTool.jsx        # Ferramenta dev para dados de teste
├── pages/
│   ├── Login/Login.jsx        # Tela de login + esqueceu senha
│   ├── Member/CellView.jsx    # Visão do membro
│   ├── Leader/CellManagement.jsx  # Gestão da célula (líder)
│   ├── Discipler/NetworkView.jsx  # Visão da rede (discipulador)
│   └── Users/
│       ├── UserManagement.jsx   # Listagem de usuários
│       ├── UserForm.jsx         # Cadastro/edição de usuários
│       └── UserDetails.jsx      # Perfil detalhado do usuário
firestore.rules                # Regras de segurança do Firestore
firestore.indexes.json         # Índices do Firestore
storage.rules                  # Regras do Storage
firebase.json                  # Config do Firebase CLI
```

### Firestore — Modelo de Dados
```
counters/
  └── users          → { lastId: <number> }

users/{authUid}      → { displayId, name, email, phone, age, cep, role, cellId, cellName, networkId, status, createdAt }

cells/{cellId}       → { name, networkId, leaderId, address }

networks/{networkId} → { name, disciplerId }

reports/{reportId}   → { cellId, networkId, ... }
```

---

## 🛠️ Setup Local

```bash
# 1. Clone
git clone <repo-url> && cd Nexo-Hub

# 2. Instale dependências
npm install

# 3. Desenvolvimento
npm run dev         # → http://localhost:5173

# 4. Deploy (apenas hosting)
npm run deploy

# 5. Deploy completo (hosting + regras + auth)
npm run build && firebase deploy
```

---

## 📝 Backlog

### ✅ Concluído
- [x] Layout premium Glassmorphism (dark theme)
- [x] Rotas protegidas por RBAC
- [x] Módulo de Gestão de Contas (CRUD completo)
- [x] Esqueceu Minha Senha funcional
- [x] IDs sequenciais para usuários (`displayId`)
- [x] Regras de segurança Firestore

### 🔜 Próximos (Prioridade Alta)
- [ ] Módulo de Relatórios de Culto/Célula (semanal/mensal)
- [ ] Módulo de Eventos/Agenda
- [ ] Dashboard com métricas e gráficos (KPIs)
- [ ] Responsividade mobile completa
- [ ] Gestão de Redes e Células (CRUD de estrutura)

### 🔮 Futuro (Produção)
- [ ] Domínio customizado (ex: nexo-hub.com.br)
- [ ] Migrar Firebase config para variáveis de ambiente (.env)
- [ ] PWA (Progressive Web App) com ícone e splash
- [ ] Notificações push (Firebase Cloud Messaging)
- [ ] Separar ambiente dev/staging/prod
- [ ] Remover SeedDevTool em produção
- [ ] Onboarding/tutorial para primeiro acesso do admin
