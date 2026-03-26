# 📱 CellHub (Sistema de Gestão de Células)

Sistema moderno e minimalista para gestão e acompanhamento de Células e Redes, desenvolvido com **React** e **Firebase**. O sistema implementa um Controle de Acesso Baseado em Papéis (RBAC - Role-Based Access Control) focado na hierarquia e jornada evolutiva da liderança comunitária.

## ✨ Funcionalidades Atuais
- **Autenticação Segura:** Login via E-mail e Senha moderno integrado ao Firebase Authentication.
- **RBAC (Role-Based Access Control):** Regras avançadas criadas direto no Firestore (`firestore.rules`).
  - **👨‍💼 Membro:** Visualiza dados apenas da sua própria célula.
  - **👑 Líder:** Visualiza a própria célula, gerencia membros e envia relatórios de presença.
  - **👁️ Discipulador:** Visualiza e acompanha os relatórios de todas as células da sua Rede.
- **UI Moderna:** Interface no padrão _Glassmorphism_ e minimalista utilizando paleta de cores Branco e Azul.

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
- [ ] Criação dos layouts internos de Dashboard.
- [ ] Rotas com diferenciação visual entre Líder, Discipulador e Membro.
- [ ] Formulário de preenchimento de relatório de células.
- [ ] Recuperação de senhas.
