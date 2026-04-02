import React, { useState, useEffect, useCallback } from 'react';
import { fetchReports } from '../../services/reportService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, FileText, CalendarDays, UserPlus, Eye, TrendingUp, AlertTriangle, Download } from 'lucide-react';

const ReportsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [reports, setReports] = useState([]);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cellFilter, setCellFilter] = useState('Todas');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  const role = userData?.role?.toLowerCase();
  const isLeader = role === 'lider' || role === 'leader';
  const isAdmin = role === 'discipulador' || role === 'root';

  const loadReports = useCallback(async () => {
    if (!userData) return;
    setLoading(true);
    try {
      const reportsData = await fetchReports(userData);
      setReports(reportsData);
      const uniqueCells = [...new Set(reportsData.map(r => r.cellName).filter(Boolean))];
      setCells(uniqueCells);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadReports();
  }, [loadReports, location.state]);

  const now = new Date();
  
  // Date Filtering Logic
  const getStartDate = (filter) => {
    const d = new Date(now);
    d.setHours(0,0,0,0);
    if (filter === 'Última Semana') { d.setDate(d.getDate() - 7); return d; }
    if (filter === 'Último Mês') { d.setMonth(d.getMonth() - 1); return d; }
    if (filter === '3 Meses') { d.setMonth(d.getMonth() - 3); return d; }
    if (filter === 'Este Ano') { d.setFullYear(d.getFullYear(), 0, 1); return d; }
    return null; // Todos
  };

  const filteredReports = reports.filter(r => {
    // Smart Search: Support Brazilian date formats like "20/03" or "20/03/2026"
    const normalizedSearch = searchTerm?.toLowerCase().trim();
    let matchesSearch = r.cellName?.toLowerCase().includes(normalizedSearch) ||
                        r.leaderName?.toLowerCase().includes(normalizedSearch);

    // If it looks like a date search (XX/XX)
    if (normalizedSearch.includes('/')) {
      const parts = normalizedSearch.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2] || '2026'; // Default to current year for search
      
      const isoDateSearch = `${year}-${month}-${day}`;
      if (r.date?.includes(isoDateSearch)) matchesSearch = true;
      // Also check partial date if only day/month provided
      if (parts.length === 2 && r.date?.includes(`-${month}-${day}`)) matchesSearch = true;
    } else {
      // Standard string check
      if (r.date?.includes(normalizedSearch)) matchesSearch = true;
    }
    
    const matchesCell = cellFilter === 'Todas' || r.cellName === cellFilter;
    
    let matchesDate = true;
    const startDate = getStartDate(dateFilter);
    if (startDate) {
      // Use noon to avoid timezone shift into the previous day
      const reportDate = new Date(r.date + 'T12:00:00');
      matchesDate = reportDate >= startDate;
    }
    
    return matchesSearch && matchesCell && matchesDate;
  });

  // Stats (Based on filtered data)
  const totalReports = filteredReports.length;
  const avgPresence = totalReports > 0
    ? Math.round(filteredReports.reduce((sum, r) => sum + (r.totalMembers > 0 ? (r.presentCount / r.totalMembers) * 100 : 0), 0) / totalReports)
    : 0;
  const totalVisitors = filteredReports.reduce((sum, r) => sum + (r.visitors || 0), 0);
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Use T12:00:00 to safely check if report is within current week local
  const hasReportThisWeek = reports.some(r => new Date(r.date + 'T12:00:00') >= startOfWeek);

  const indexOfLast = currentPage * reportsPerPage;
  const indexOfFirst = indexOfLast - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  // Export CSV (for discipulador/root)
  const exportCSV = () => {
    const headers = ['Data', 'Dia da Semana', 'Célula', 'Líder', 'Presentes', 'Ausentes', 'Total Membros', '% Presença', 'Visitantes', 'Observações'];
    const rows = filteredReports.map(r => {
      const pct = r.totalMembers > 0 ? Math.round((r.presentCount / r.totalMembers) * 100) : 0;
      return [
        new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR'),
        r.meetingDayLabel || '',
        r.cellName || '',
        r.leaderName || '',
        r.presentCount || 0,
        r.absentCount || 0,
        r.totalMembers || 0,
        pct + '%',
        r.visitors || 0,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorios_nexo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Table columns based on role
  const leaderColumns = ['Data', 'Presença', 'Visitantes', 'Ações'];
  const adminColumns = ['Data', 'Célula', 'Líder', 'Presença', 'Visitantes', 'Ações'];
  const columns = isLeader ? leaderColumns : adminColumns;

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexShrink: 0 }}>
        <h1 style={{ margin: 0 }}>Gestão de Relatórios</h1>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div className="card static" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary-color)' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Relatórios</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalReports}</div>
          </div>
        </div>

        <div className="card static" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--success-color)' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presença Média</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{avgPresence}%</div>
          </div>
        </div>

        <div className="card static" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--secondary-color)' }}>
            <UserPlus size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Visitantes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalVisitors}</div>
          </div>
        </div>

        <div className="card static" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: hasReportThisWeek ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '10px', color: hasReportThisWeek ? 'var(--success-color)' : '#f59e0b' }}>
            {hasReportThisWeek ? <CalendarDays size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Esta Semana</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: hasReportThisWeek ? 'var(--success-color)' : '#f59e0b' }}>
              {hasReportThisWeek ? 'Relatório Enviado ✓' : 'Pendente'}
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card static" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-color)' }}>

        {/* Top Toolbox */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: 'transparent', border: 'none', fontSize: '0.875rem', color: 'var(--text-main)', outline: 'none' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {isAdmin && cells.length > 1 && (
            <>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {['Todas', ...cells.slice(0, 3)].map(cell => (
                  <button
                    key={cell}
                    onClick={() => { setCellFilter(cell); setCurrentPage(1); }}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none',
                      fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: cellFilter === cell ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: cellFilter === cell ? 'var(--primary-color)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cell}
                  </button>
                ))}
                {cells.length > 3 && (
                   <select 
                    value={cells.includes(cellFilter) && !['Todas', ...cells.slice(0, 3)].includes(cellFilter) ? cellFilter : 'Outros'}
                    onChange={(e) => { setCellFilter(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-muted)', fontSize: '0.8rem', outline: 'none' }}
                   >
                     <option value="Outros" disabled>Outras células...</option>
                     {cells.slice(3).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                )}
              </div>
            </>
          )}

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
          
          {/* Date Filter */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {['Todos', 'Última Semana', 'Último Mês', '3 Meses', 'Este Ano'].map(period => (
              <button
                key={period}
                onClick={() => { setDateFilter(period); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
                  fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: dateFilter === period ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                  color: dateFilter === period ? 'var(--primary-color)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {period}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Export button for admins */}
          {isAdmin && reports.length > 0 && (
            <button onClick={exportCSV} style={{ background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}>
              <Download size={16} /> Exportar CSV
            </button>
          )}

          {isLeader && (
            <button onClick={() => navigate('/reports/new')} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--primary-color)'}>
              <Plus size={18} /> Novo Relatório
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando relatórios...</div>
        ) : (
          <>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {columns.map(header => (
                      <th key={header} style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', fontWeight: '700', fontSize: '0.75rem', textAlign: header === 'Ações' ? 'center' : 'left' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum relatório encontrado.</td></tr>
                  ) : (
                    currentReports.map((report, idx) => {
                      const presencePercent = report.totalMembers > 0 ? Math.round((report.presentCount / report.totalMembers) * 100) : 0;
                      return (
                        <tr key={report.id} style={{ cursor: 'default', background: idx % 2 === 0 ? 'var(--surface-color)' : 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'} onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface-color)' : 'var(--surface-hover)'}>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '500' }}>
                            <div>{new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{report.meetingDayLabel}</div>
                          </td>
                          {isAdmin && (
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--primary-light)', fontWeight: '600' }}>
                              {report.cellName || '—'}
                            </td>
                          )}
                          {isAdmin && (
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                              {report.leaderName || '—'}
                            </td>
                          )}
                          <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{report.presentCount}/{report.totalMembers}</span>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '999px',
                                background: presencePercent >= 70 ? 'rgba(16, 185, 129, 0.15)' : presencePercent >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: presencePercent >= 70 ? 'var(--success-color)' : presencePercent >= 40 ? '#f59e0b' : 'var(--danger-color)'
                              }}>
                                {presencePercent}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: report.visitors > 0 ? 'var(--secondary-color)' : 'var(--text-muted)', fontWeight: report.visitors > 0 ? '700' : '400' }}>
                            {report.visitors || 0}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              onClick={() => navigate(`/reports/${report.id}`)}
                              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', transition: 'background 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)'}
                              onMouseOut={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}
                            >
                              <Eye size={14} /> Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                {filteredReports.length > 0 ? `${indexOfFirst + 1} - ${Math.min(indexOfLast, filteredReports.length)} de ${filteredReports.length} relatórios` : '0 relatórios'}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)' }}>&lt;</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: currentPage === i + 1 ? '#93c5fd' : 'transparent', color: currentPage === i + 1 ? '#1e3a8a' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)' }}>&gt;</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsList;
