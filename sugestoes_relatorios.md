# Análise e Sugestões — Módulo de Gestão de Relatórios

## O que já está implementado ✅

| Funcionalidade | Status |
|---|---|
| Formulário de relatório semanal (dia, presença, visitantes, foto, notas) | ✅ |
| Restrição de 1 envio por semana | ✅ |
| Listagem com KPIs (total, presença média, visitantes, status semanal) | ✅ |
| Visão diferenciada Líder vs Discipulador/Root | ✅ |
| Detalhes com lista nominal (presentes/ausentes) e foto | ✅ |
| Exportação CSV para admins | ✅ |
| Upload de foto obrigatório via Firebase Storage | ✅ |
| Validação inline com campos vermelhos | ✅ |
| Loading overlay durante envio | ✅ |
| Paginação e busca | ✅ |

---

## Sugestões de Melhoria — Ordenadas por Impacto

### 🔥 Alta Prioridade (Valor imediato para líderes e discipuladores)

#### 1. Histórico de Presença Individual do Membro
> Quando um líder ou discipulador abre o perfil de um membro, mostrar quantas vezes ele esteve presente nas últimas 4/8/12 semanas, com percentual de frequência. Isso permite identificar membros que estão se afastando **antes que abandonem a célula**.

```
Exemplo: "João Silva — 75% de presença (6 de 8 semanas)"
```

#### 2. Alerta de Membros com Baixa Frequência
> No dashboard do Líder e do Discipulador, exibir um card de alerta com membros que tiveram **menos de 50% de presença nas últimas 4 semanas**. Um sinal de atenção pastoral que pode prevenir evasão.

#### 3. Filtro por Período na Listagem
> Atualmente a lista mostra todos os relatórios sem filtro de data. Adicionar filtros como "Último mês", "Últimos 3 meses", "Este ano", ou um date range picker customizado. Isso facilita a vida do Discipulador que precisa analisar um período específico.

#### 4. Notificação de Relatório Pendente
> Se for segunda-feira e o líder ainda não enviou o relatório da semana anterior, exibir um banner de alerta no topo do dashboard: *"Você ainda não enviou o relatório desta semana!"* com botão direto para o formulário.

---

### 🟡 Média Prioridade (Profissionalizam o produto)

#### 5. Dashboard de Gráficos para Discipulador
> Uma aba dedicada com gráficos de evolução:
> - **Linha**: Presença média da rede ao longo das semanas
> - **Barras**: Comparativo de visitantes entre células
> - **Rosca/Pie**: Distribuição de presença por célula
> 
> Bibliotecas sugeridas: `recharts` ou `chart.js`

#### 6. Ranking de Células
> No painel do Discipulador/Root, exibir um ranking das células ordenado por:
> - Maior presença média
> - Mais visitantes acumulados
> - Consistência de envio de relatórios (streak)
> 
> Isso cria um senso saudável de engajamento entre líderes.

#### 7. Campo "Tema/Estudo" no Relatório
> Adicionar um campo opcional onde o líder registra o tema ou passagem bíblica estudada na célula. Útil para o discipulador acompanhar o conteúdo ministrado e para gerar um histórico de estudos.

#### 8. Edição de Relatório (dentro de 24h)
> Permitir que o líder edite um relatório já enviado **dentro de 24 horas** após o envio (para corrigir erros). Após esse prazo, fica bloqueado. Exibir badge "Editado" nos relatórios alterados.

---

### 🔵 Baixa Prioridade (Diferenciais competitivos)

#### 9. Relatório em PDF
> Botão "Gerar PDF" na página de detalhes que gera um documento formatado com logo do Nexo-Hub, dados da célula, lista de presença e foto. Útil para impressão e arquivamento por líderes que preferem papel.
> 
> Biblioteca sugerida: `jspdf` + `html2canvas`

#### 10. Observações por Membro
> Na lista de presença do formulário, permitir que o líder adicione uma nota individual ao marcar como ausente (ex: "Doente", "Viagem", "Visitou outra célula"). Isso enriquece o acompanhamento pastoral.

#### 11. Streak de Envio
> Na lista de relatórios do líder, mostrar um contador de "sequência de envios" (ex: "🔥 5 semanas consecutivas"). Gamificação leve que incentiva consistência.

#### 12. Registro Nominal de Visitantes
> Atualmente registra apenas a quantidade de visitantes (número). Permitir que o líder cadastre **nome e contato** dos visitantes para follow-up. Isso é essencial para o crescimento da célula e conversão de visitantes em membros.

---

## Sugestões Técnicas

| Item | Detalhe |
|---|---|
| **Code splitting** | O bundle está com 730KB. Usar `React.lazy()` + `Suspense` para carregar Report/User pages sob demanda |
| **Compressão de imagem** | Antes do upload, redimensionar a foto client-side para max 1200px e comprimir para ~200KB. Reduz custos do Storage |
| **Cache de membros** | Cachear a lista de membros no `localStorage` por sessão para evitar re-fetch a cada abertura do form |
| **Firestore composite index** | Substituir a verificação semanal client-side por índice composto `cellId + date` para queries mais eficientes em escala |

---

## Priorização Sugerida para Próxima Sprint

> [!IMPORTANT]
> Recomendo implementar nesta ordem para máximo impacto com mínimo esforço:

1. **Filtro por período** (30 min) — melhora UX imediata do discipulador
2. **Notificação de relatório pendente** (30 min) — banner no dashboard
3. **Histórico de presença individual** (1-2h) — valor pastoral imediato
4. **Alerta de baixa frequência** (1h) — prevenção de evasão
5. **Dashboard com gráficos** (2-3h) — profissionaliza o produto
6. **Campo tema/estudo** (15 min) — dado extra valioso
