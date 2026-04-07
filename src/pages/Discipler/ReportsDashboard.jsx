import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { 
  BarChart3, 
  Calendar, 
  ChevronDown, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Home, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { fetchCells } from '../../services/cellService';
import { fetchReports } from '../../services/reportService';
import { fetchNetworkById } from '../../services/networkService';
import LoadingFallback from '../../components/Common/LoadingFallback';

const ReportsDashboard = () => {
  const { userData } = useAuth();
  const { notify } = useGlobal();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [network, setNetwork] = useState(null);
  const [cells, setCells] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Filters
  const [selectedCellId, setSelectedCellId] = useState('all');
  const [period, setPeriod] = useState('30'); // '7', '30', '60', '90'

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (!userData?.networkId) return;

      const [networkData, cellsData] = await Promise.all([
        fetchNetworkById(userData.networkId),
        fetchCells({ networkId: userData.networkId })
      ]);

      setNetwork(networkData);
      setCells(cellsData);

      // Calcular data de início baseado no período
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      const startDateStr = startDate.toISOString().split('T')[0];

      const reportsData = await fetchReports(userData, { 
        startDate: startDateStr
      });

      setReports(reportsData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      notify('error', 'Falha ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userData, period]);

  // Agregações Filtradas
  const filteredReports = useMemo(() => {
    if (selectedCellId === 'all') return reports;
    return reports.filter(r => r.cellId === selectedCellId);
  }, [reports, selectedCellId]);

  const stats = useMemo(() => {
    if (filteredReports.length === 0) return { avgPresence: 0, totalVisitors: 0, totalReports: 0 };

    const totalReports = filteredReports.length;
    const totalVisitors = filteredReports.reduce((acc, r) => acc + (r.visitors || 0), 0);
    
    const totalPresenceSum = filteredReports.reduce((acc, r) => {
      const presence = r.totalMembers > 0 ? (r.presentCount / r.totalMembers) * 100 : 0;
      return acc + presence;
    }, 0);
    
    const avgPresence = Math.round(totalPresenceSum / totalReports);

    return {
      avgPresence,
      totalVisitors,
      totalReports
    };
  }, [filteredReports]);

  const cellSummaries = useMemo(() => {
    return cells.map(cell => {
      const cellReports = reports.filter(r => r.cellId === cell.id);
      if (cellReports.length === 0) return { ...cell, reportsCount: 0, avgPresence: 0, totalVisitors: 0 };

      const totalVs = cellReports.reduce((acc, r) => acc + (r.visitors || 0), 0);
      const presenceSum = cellReports.reduce((acc, r) => {
        const presence = r.totalMembers > 0 ? (r.presentCount / r.totalMembers) * 100 : 0;
        return acc + presence;
      }, 0);

      return {
        ...cell,
        reportsCount: cellReports.length,
        avgPresence: Math.round(presenceSum / cellReports.length),
        totalVisitors: totalVs
      };
    }).sort((a, b) => b.avgPresence - a.avgPresence);
  }, [cells, reports]);

  const handleExportExcel = async () => {
    notify('info', 'Preparando Excel...');
    try {
      const XLSX = await import('xlsx').catch(() => null);
      if (!XLSX) {
        notify('error', 'Biblioteca XLSX não instalada. Execute: npm install xlsx');
        return;
      }

      const data = cellSummaries.map(c => ({
        'Célula': c.name,
        'Líder': c.leaderName || 'N/A',
        'Relatórios no Período': c.reportsCount,
        'Média Presença (%)': c.avgPresence,
        'Total Visitantes': c.totalVisitors
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resumo da Rede");
      XLSX.writeFile(wb, `Resumo_Rede_${period}dias.xlsx`);
    } catch (err) {
      console.error(err);
      notify('error', 'Erro ao exportar Excel.');
    }
  };

  const handleExportPDF = async () => {
    notify('info', 'Gerando PDF...');
    try {
      const { default: jsPDF } = await import('jspdf').catch(() => ({ default: null }));
      const autoTable = await import('jspdf-autotable').catch(() => null);

      if (!jsPDF) {
        notify('error', 'Biblioteca jsPDF não instalada.');
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Resumo Analítico - ${network?.name || 'Rede'}`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Período: Últimos ${period} dias | Extraído em: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Célula", "Líder", "Relatórios", "Média Presença", "Visitantes"];
      const tableRows = cellSummaries.map(c => [
        c.name,
        c.leaderName || '-',
        c.reportsCount,
        `${c.avgPresence}%`,
        c.totalVisitors
      ]);

      if (doc.autoTable) {
        doc.autoTable({
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] }
        });
      }

      doc.save(`Relatorio_Rede_${period}dias.pdf`);
    } catch (err) {
      console.error(err);
      notify('error', 'Erro ao exportar PDF.');
    }
  };

  if (loading) return <LoadingFallback />;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', fontWeight: '800' }}>
              <BarChart3 size={32} color="var(--primary-color)" /> Dashboard de Relatórios
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
              Supervisão analítica da <strong>{network?.name}</strong>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => loadData(true)} 
              className="btn-secondary" 
              style={{ padding: '0.6rem', borderRadius: '10px' }}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExportExcel} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
              <FileSpreadsheet size={18} /> Excel
            </button>
            <button onClick={handleExportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
              <Download size={18} /> PDF
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} color="var(--primary-color)" />
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>Filtros:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', position: 'relative' }}>
            <Home size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', zIndex: 1 }} />
            <select 
              value={selectedCellId} 
              onChange={e => setSelectedCellId(e.target.value)}
              style={{ 
                flex: 1, 
                background: 'var(--surface-color)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '10px', 
                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                color: 'var(--text-main)', 
                fontWeight: '600',
                fontSize: '0.9rem',
                appearance: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <option value="all">Todas as Células (Geral da Rede)</option>
              {cells.map(c => (
                <option key={c.id} value={c.id} style={{ background: 'var(--surface-color)', color: 'var(--text-main)' }}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '1rem', pointerEvents: 'none' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: '8px', padding: '0.25rem' }}>
              {[
                { val: '7', label: '7D' },
                { val: '30', label: '30D' },
                { val: '60', label: '60D' },
                { val: '90', label: '90D' }
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => setPeriod(p.val)}
                  style={{ 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    border: 'none', 
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: period === p.val ? 'var(--primary-color)' : 'transparent',
                    color: period === p.val ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
                <FileText size={24} />
              </div>
              <TrendingUp size={18} color="var(--success-color)" />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Relatórios Enviados</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0.25rem 0' }}>{stats.totalReports}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nos últimos {period} dias</div>
          </div>

          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success-color)' }}>
                <Users size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: stats.avgPresence >= 70 ? 'var(--success-color)' : '#f59e0b' }}>
                {stats.avgPresence >= 70 ? 'Excelente' : 'Atenção'}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Média de Presença</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0.25rem 0' }}>{stats.avgPresence}%</div>
            <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${stats.avgPresence}%`, height: '100%', background: 'var(--success-color)', borderRadius: '3px' }} />
            </div>
          </div>

          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '12px', color: '#f59e0b' }}>
                <UserPlus size={24} />
              </div>
              <ArrowRight size={18} color="#f59e0b" />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Total de Visitantes</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0.25rem 0' }}>{stats.totalVisitors}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crescimento da rede</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Ranking de Engajamento por Célula</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ordenado por média de presença</div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Célula</th>
                  <th style={{ textAlign: 'center' }}>Relatórios</th>
                  <th style={{ textAlign: 'center' }}>Média Presença</th>
                  <th style={{ textAlign: 'center' }}>Visitantes</th>
                </tr>
              </thead>
              <tbody>
                {cellSummaries.map(cell => (
                  <tr key={cell.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{cell.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Líder: {cell.leaderName || 'Não definido'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: '700',
                        background: cell.reportsCount >= (parseInt(period) / 7) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: cell.reportsCount >= (parseInt(period) / 7) ? 'var(--success-color)' : 'var(--danger-color)'
                      }}>
                        {cell.reportsCount} envios
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: cell.avgPresence >= 70 ? 'var(--success-color)' : '#f59e0b' }}>
                        {cell.avgPresence}%
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{cell.totalVisitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
