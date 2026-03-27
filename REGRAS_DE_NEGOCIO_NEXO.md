# Nexo - Regras de Negócio e Arquitetura de Permissões

## 1. Visão Geral
O **Nexo** (anteriormente CellHub) é uma plataforma de gestão e supervisão estruturada de redes de igrejas. O sistema opera baseado em uma hierarquia de acesso (Role-Based Access Control - RBAC) robusta com autenticação e banco de dados via Firebase (Auth & Firestore).

## 2. Níveis de Acesso (Roles da Hierarquia)
O sistema possui 4 papéis distintos. A visibilidade de informações atua em formato de cascata, refletindo a hierarquia real da igreja.

### 2.1 Membro (`membro` ou `member`)
- **Escopo Visual**: Estritamente atrelado à Célula do membro.
- **Relatórios**: Não tem acesso preenchimento. Pode apenas ver dados da própria célula sob a aba "Minha Célula".
- **Gestão de Acosses**: Proibido.

### 2.2 Líder de Célula (`lider` ou `leader`)
- **Escopo Visual**: Total controle da **própria Célula**.
- **Atribuições**: 
  - Possui a responsabilidade de gerir relatórios de presença da sua célula no menu *Gestão da Célula*.
- **Criação de Contas**:
  - Têm autorização para criar contas no sistema.
  - **Restrição Crucial**: Só podem atribuir o nível "Membro".
  - **Restrição de Vínculo**: Qualquer usuário criado por um Líder será automática e forçosamente vinculado à Célula do Líder que o criou.

### 2.3 Discipulador (`discipulador`)
- **Escopo Visual**: Supervisão Completa sobre uma **Rede** (Grupo de Células).
- **Atribuições**:
  - Consolidação de dados e visão unificada das células sob sua aba ("Visão da Rede").
- **Criação de Contas**:
  - Acesso ao painel administrativo Master-Level ("Gestão de Usuários").
  - Pode criar novos Líderes e Membros.
  - Pode alocar os usuários a qualquer Célula de sua supervisão.

### 2.4 Administrador Root (`root`)
- **Escopo Visual**: Irrestrito à toda a plataforma corporativa Nexo.
- **Atribuições**:
  - Responsável por montar a macro-estrutura do app.
  - Único cargo que pode credenciar novos administradores (Discipuladores) e intervir globalmente.

## 3. Fluxo de Criação de Contas (Onboarding Interno)
A plataforma trabalha com um fluxo profissional fechado de cadastro:
- **Ausência de Rota Aberta ("Sign-up Aberto")**: Membros não se cadastram sozinhos na Home para gerar contas fantasmas e esperar aceite. O registro só é gerado internamente pela própria Liderança.
- **Uso do Secondary App**: A arquitetura instancia em *Background* um aplicativo paralelo (devido restrições nativas do Firebase). Assim, o Administrador consegue registrar email e dados da nova pessoa sem que o sistema deslogue ele no frontend. 
- **Verificação Dinâmica**: Com a conta criada em Nuvem, o Firebase Auth efetua um disparo seguro ("Redefinição de Senha") para a caixa de e-mail corporativo/pessoal do cadastrado. Ele assume sua própria conta a partir dali.
