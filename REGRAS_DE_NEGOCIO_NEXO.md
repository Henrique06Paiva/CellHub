# 📘 Nexo-Hub — Regras de Negócio & RBAC

## 1. Visão Geral
O **Nexo-Hub** é uma plataforma SaaS para gestão e supervisão estruturada de redes de igrejas. O sistema opera baseado em uma hierarquia de acesso (Role-Based Access Control - RBAC) robusta, com autenticação via Firebase Auth e persistência via Firestore.

---

## 2. Níveis de Acesso (Hierarquia)

A visibilidade e o poder de edição seguem uma estrutura de cascata:

### 2.1 Membro (`membro`)
- **Escopo**: Restrito à sua própria célula.
- **Permissões**: Visualização de informações da célula e histórico de presença pessoal. Não possui acesso a funções administrativas.

### 2.2 Líder de Célula (`lider`)
- **Escopo**: Controle total sobre a **própria Célula**.
- **Ações**: 
  - Gestão de membros (adicionar/editar).
  - Preenchimento do **Relatório Semanal** de encontro da célula.
- **Restrição de Cadastro**: Pode criar novas contas, mas apenas com o perfil "Membro" e vinculadas obrigatoriamente à sua própria célula.

### 2.3 Discipulador (`discipulador`)
- **Escopo**: Supervisão de uma **Rede** (conjunto de células).
- **Ações**:
  - Visão consolidada de todos os relatórios e membros da sua rede.
  - Gestão de Líderes e Membros.
  - Alocação de usuários entre as células sob sua supervisão.

### 2.4 Administrador Root (`root`)
- **Escopo**: Acesso global e irrestrito.
- **Ações**:
  - Configuração da macro-estrutura (Criação de Redes e Células).
  - Credenciamento de novos Discipuladores.
  - Intervenção global em qualquer dado do sistema.

---

## 3. Regras de Relatórios de Célula 📋

O módulo de relatórios é o coração da coleta de dados operacionais:

- **Periodicidade**: Apenas **um relatório por semana** é permitido por célula para evitar duplicidade de dados.
- **Obrigatoriedade de Foto**: Todo relatório deve conter uma foto do encontro para validação e registro histórico.
- **Composição**: Inclui lista nominal de presença (com observações individuais), contagem de visitantes e notas gerais do encontro.
- **Edição**: Por segurança e integridade histórica, relatórios enviados são protegidos, sendo a exclusão/edição permitida apenas por níveis superiores (Discipulador/Root).

---

## 4. Fluxo de Onboarding (Segurança)

- **Sem Cadastro Aberto**: Não existe tela de "Sign-up". Todos os usuários são inseridos no sistema por um superior.
- **Configuração de Senha**: Ao ser cadastrado, o usuário recebe um e-mail automático de "Redefinição de Senha" para definir sua credencial e realizar o primeiro acesso com segurança.
- **Transaction ID**: Cada usuário recebe um ID sequencial único (ex: `#042`) gerado no momento da criação para facilitar a identificação pastoral fora do ambiente digital.
