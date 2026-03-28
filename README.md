# 📱 Nexo (Sistema de Gestão de Células)

Sistema moderno e minimalista para gestão e acompanhamento de Redes, focado na jornada evolutiva da liderança e supervisão comunitária. Desenvolvido com **React** e **Firebase**.

> 📚 **Veja as Regras de Negócio completas e a Arquitetura de Papéis no arquivo [`REGRAS_DE_NEGOCIO_NEXO.md`](./REGRAS_DE_NEGOCIO_NEXO.md)**.

## ✨ Funcionalidades Atuais
- **Autenticação Segura:** Login via E-mail e Senha integrado ao Firebase Authentication (Fluxo de contas seguras com Secondary Apps).
- **Gestão Global de Contas:** Módulo com formulário Premium de duas colunas, segmentação por blocos e validação em tempo real. Discipuladores registram novos Líderes e Membros de acordo com as permissões exatas da Firebase Store.
- **RBAC Integrado na Interface:** 
  - **👨‍💼 Membro:** Visualiza dados apenas da sua própria célula.
  - **👑 Líder:** Administra localmente a sua célula, com permissão limitada.
  - **👁️ Discipulador:** Monitora a totalização da sua Rede através do dashboard global.
  - **💻 Root:** Mestre absoluto para estruturar novas redes e Discipuladores.
- **UI Moderna:** Interface fluída baseada em _Glassmorphism_, animações ágeis, modals limpos em UI/UX focado em Enterprise SaaS.

## 🚀 Tecnologias Utilizadas
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
- CSS Vanilla (CSS Variables, Flexbox, Animations)
- [Lucide-React](https://lucide.dev/) (Ícones)
- React Router DOM (Mapeamento de Rotas Privadas e Públicas)

## 🛠️ Como Executar o Projeto Localmente

1. **Clone o repositório (`git clone`)** e acesse a pasta.
2. **Instale as dependências** da aplicação em Node:
```bash
npm install
```

3. **Configuração do Firebase (.env)**
Você precisará ter um projeto no Firebase configurado. Obtenha as chaves públicas em _Configurações do Projeto_ > _Geral_ e as aplique nas configurações internas ou em contexto de variávies de ambiente se aplicável para `src/contexts/AuthContext.jsx`.

4. **Inicie o servidor de desenvolvimento (Vite)**
```bash
npm run dev
```
Acesse [http://localhost:5173](http://localhost:5173) no seu navegador.

## 🔐 Regras do Banco de Dados (Backend Firestore)
As regras de segurança estão armazenadas no repositório no arquivo `firestore.rules`. Elas impedem o acesso indevido garantindo a separação de escopos de cada nível da Igreja.

Para subi-las ao banco real em nuvem de maneira local, você pode utilizar a Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## 📝 Próximos Passos (Backlog)
- [x] Criação do Layout Premium estilo Glassmorphism (Dashboard).
- [x] Rotas e Módulos com diferenciação visual entre Supervisão, Liderança e Membro.
- [x] Módulo Avançado de Gestão de Contas (Painel Administrativo da Nuvem).
- [ ] Módulo Administrativo: Organogramas, Células e Redes.
- [ ] Formulário Interativo de Relatório de Cultos/Células Mensais ou Semanais.
- [ ] Página Esqueci Minha Senha vinculada ao Firebase Auth.
