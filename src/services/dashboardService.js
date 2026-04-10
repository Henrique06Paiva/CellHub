import { subDays, isAfter, format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa as métricas do painel baseado nos relatórios e células contidas.
 * @param {Array} cells Lista de células da rede
 * @param {Array} reports Lista de relatórios carregados do backend
 * @param {String} period Período selecionado em dias (ex: '90', '180')
 * @returns {Object} { metrics, chartData }
 */
export const processDashboardMetrics = (cells = [], reports = [], period = '30') => {
  const now = new Date();
  
  // ==========================================
  // CARD 1: TOTAL MEMBERS
  // ==========================================
  const totalMembers = cells.reduce((acc, cell) => acc + (Number(cell.membersCount) || 0), 0);

  // ==========================================
  // CARD 2: PRESENCE RATE (Ultimos 30 Dias vs 30 Dias Anteriores)
  // ==========================================
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  const current30dReports = reports.filter(r => isAfter(parseISO(r.date), thirtyDaysAgo));
  const previous30dReports = reports.filter(r => {
    const d = parseISO(r.date);
    return isAfter(d, sixtyDaysAgo) && !isAfter(d, thirtyDaysAgo);
  });

  const calculatePresence = (reps) => {
    if (!reps || reps.length === 0) return 0;
    const { present, total } = reps.reduce((acc, r) => {
      acc.present += (Number(r.presentCount) || 0);
      acc.total += (Number(r.totalMembers) || 0);
      return acc;
    }, { present: 0, total: 0 });

    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  const presenceRate30d = calculatePresence(current30dReports);
  const presenceRatePrev30d = calculatePresence(previous30dReports);
  
  const presenceTrend = presenceRatePrev30d === 0 
    ? 0 
    : presenceRate30d - presenceRatePrev30d;

  // ==========================================
  // CARD 3: PENDING REPORTS (Últimos 7 Dias)
  // ==========================================
  const sevenDaysAgo = subDays(now, 7);
  const latest7dReports = reports.filter(r => isAfter(parseISO(r.date), sevenDaysAgo));
  
  const cellsWithRecentReports = new Set(latest7dReports.map(r => r.cellId));
  const pendingCellsList = cells.filter(cell => !cellsWithRecentReports.has(cell.id));
  const pendingCellsCount = pendingCellsList.length;

  // ==========================================
  // LINE CHART: EVOLUÇÃO MENSAL
  // ==========================================
  const chartMap = {};
  
  // Preenchendo os meses vazios dependendo do periodo (90 = 3 meses, 180 = 6 meses, 365 = 12 meses)
  const numberOfMonths = Math.ceil(parseInt(period) / 30);
  
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const m = format(startOfMonth(d), 'MMM yy', { locale: ptBR });
    const fmt = m.charAt(0).toUpperCase() + m.slice(1); // Ex: Abr 26
    
    chartMap[fmt] = {
      month: fmt,
      timestamp: startOfMonth(d).getTime(),
      presentes: 0,
      expectativa: 0,
    };
  }

  // Preenche valores reais
  reports.forEach(r => {
    try {
      const gDate = parseISO(r.date);
      const m = format(gDate, 'MMM yy', { locale: ptBR });
      const formatedKey = m.charAt(0).toUpperCase() + m.slice(1);

      if (chartMap[formatedKey]) {
        chartMap[formatedKey].presentes += (Number(r.presentCount) || 0);
        chartMap[formatedKey].expectativa += (Number(r.totalMembers) || 0);
      }
    } catch(e) { /* ignore */ }
  });

  const chartData = Object.values(chartMap).sort((a, b) => a.timestamp - b.timestamp).map(item => ({
    ...item,
    taxa: item.expectativa > 0 ? Math.round((item.presentes / item.expectativa) * 100) : 0
  }));

  return {
    metrics: {
      totalMembers,
      presenceRate30d,
      presenceRatePrev30d,
      presenceTrend,
      pendingCellsCount,
      pendingCellsList
    },
    chartData
  };
};
