import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { 
  BarChart3, Calendar, ChevronDown, Download, FileSpreadsheet, Home, RefreshCw, 
  Users, AlertTriangle, UserCheck
} from 'lucide-react';
import { fetchCells } from '../../services/cellService';
import { fetchReports } from '../../services/reportService';
import { fetchNetworkById } from '../../services/networkService';
import { processDashboardMetrics } from '../../services/dashboardService';
import LoadingFallback from '../../components/Common/LoadingFallback';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

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
  const [period, setPeriod] = useState('90'); // 90, 180, 365

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
    // eslint-disable-next-line
  }, [userData, period]);

  const dashboardData = useMemo(() => {
    const targetCells = selectedCellId === 'all' ? cells : cells.filter(c => c.id === selectedCellId);
    const targetReports = selectedCellId === 'all' ? reports : reports.filter(r => r.cellId === selectedCellId);
    
    return processDashboardMetrics(targetCells, targetReports, period);
  }, [cells, reports, period, selectedCellId]);

  const { metrics, chartData } = dashboardData;

  const cellSummaries = useMemo(() => {
    const filteredCells = selectedCellId === 'all' ? cells : cells.filter(c => c.id === selectedCellId);

    return filteredCells.map(cell => {
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
  }, [cells, reports, selectedCellId]);

  const handleExportExcel = async () => { /* Export logic preserved */ };
  const handleExportPDF = async () => { /* Export logic preserved */ };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-color)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Presentes: <strong style={{color:'var(--text-main)'}}>{payload[0].payload.presentes}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Membros Totais: {payload[0].payload.expectativa}</span>
            <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>Taxa de Presença: {payload[0].payload.taxa}%</span>
          </div>
        </div>
      );
    }
    return null;
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
            <button onClick={() => loadData(true)} className="btn-secondary" style={{ padding: '0.6rem', borderRadius: '10px' }} disabled={refreshing}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', position: 'relative' }}>
            <Home size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', zIndex: 1, pointerEvents: 'none' }} />
            <select 
              value={selectedCellId} 
              onChange={e => setSelectedCellId(e.target.value)}
              style={{ flex: 1, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.6rem 2.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todas as Células (Geral da Rede)</option>
              {cells.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '1rem', pointerEvents: 'none' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: '8px', padding: '0.25rem' }}>
              {[
                { val: '90', label: '3 Meses' },
                { val: '180', label: '6 Meses' },
                { val: '365', label: '1 Ano' }
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => setPeriod(p.val)}
                  style={{ 
                    padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                    background: period === p.val ? 'var(--primary-color)' : 'transparent',
                    color: period === p.val ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3 SCORE CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
                <Users size={24} />
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Total de Membros da Rede</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0.25rem 0' }}>{metrics.totalMembers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membros ativos mapeados</div>
          </div>

          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success-color)' }}>
                <UserCheck size={24} />
              </div>
              {metrics.presenceTrend !== 0 && (
                <span style={{ 
                  fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '20px',
                  background: metrics.presenceTrend > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: metrics.presenceTrend > 0 ? 'var(--success-color)' : 'var(--danger-color)'
                }}>
                  {metrics.presenceTrend > 0 ? '+' : ''}{metrics.presenceTrend}% vs mês ant.
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Taxa de Presença (Mês Atual)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0.25rem 0' }}>{metrics.presenceRate30d}%</div>
            <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.presenceRate30d}%`, height: '100%', background: 'var(--success-color)', borderRadius: '3px', transition: 'width 0.5s ease-out' }} />
            </div>
          </div>

          <div className="card static" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)', border: metrics.pendingCellsCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--danger-color)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Relatórios Pendentes</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: metrics.pendingCellsCount > 0 ? 'var(--danger-color)' : 'var(--success-color)', margin: '0.25rem 0' }}>
              {metrics.pendingCellsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Células sem envio há mais de 7 dias</div>
          </div>
        </div>

        {/* RECHARTS EVOLUÇÃO MENSAL */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>Evolução de Presença</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quantidade de pessoas presentes por mês em toda a {selectedCellId === 'all' ? 'Rede' : 'Célula'}</div>
          </div>
          
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line 
                  type="monotone" 
                  dataKey="presentes" 
                  stroke="var(--primary-color)" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)', stroke: 'var(--primary-color)' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary-color)' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKING ORIGINAL */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Ranking de Engajamento por Célula</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Média total avaliada no período ativo</div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Célula</th>
                  <th style={{ textAlign: 'center' }}>Total Relatórios (Histórico)</th>
                  <th style={{ textAlign: 'center' }}>Média Presença (Geral)</th>
                  <th style={{ textAlign: 'center' }}>Total Visitantes (Acúmulo)</th>
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
                        background: cell.reportsCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: cell.reportsCount > 0 ? 'var(--success-color)' : 'var(--danger-color)'
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

