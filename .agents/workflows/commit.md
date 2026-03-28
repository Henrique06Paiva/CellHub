---
description: Padrão de commits profissional do Nexo-Hub (Conventional Commits)
---

# Padrão de Commits — Nexo-Hub

Utilizamos o padrão **Conventional Commits** adaptado para o projeto.

## Formato

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional>
```

## Tipos Permitidos

| Tipo       | Quando usar                                                  |
|------------|--------------------------------------------------------------|
| `feat`     | Nova funcionalidade visível ao usuário                       |
| `fix`      | Correção de bug                                              |
| `refactor` | Refatoração de código sem alterar comportamento              |
| `style`    | Alterações visuais/CSS (sem lógica)                          |
| `chore`    | Tarefas de manutenção (deps, configs, scripts)               |
| `docs`     | Alterações em documentação                                   |
| `perf`     | Melhorias de performance                                     |
| `security` | Regras de segurança (Firestore Rules, Storage Rules)         |
| `deploy`   | Configurações de deploy (firebase.json, indexes)             |

## Escopos Comuns

`auth`, `users`, `reports`, `cells`, `layout`, `sidebar`, `dashboard`, `devtool`, `firestore`, `storage`, `routing`

## Exemplos

```
feat(reports): add weekly report form with photo upload
fix(reports): refresh list after submitting new report
refactor(users): extract field validation to inline errors
style(layout): adjust sidebar profile section colors
chore(firestore): add composite indexes for reports queries
security(firestore): add rules for reports collection
deploy(hosting): configure firebase hosting for SPA
```

## Regras

1. **Descrição sempre em inglês** (padrão da indústria)
2. **Máximo 72 caracteres** na primeira linha
3. **Letra minúscula** no início da descrição
4. **Sem ponto final** na descrição
5. **Corpo opcional** para detalhes adicionais (separado por linha em branco)
6. Um commit por **unidade lógica de mudança** — não misture features diferentes
