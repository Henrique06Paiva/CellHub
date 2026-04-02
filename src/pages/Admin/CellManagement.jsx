import React, { useState, useEffect } from 'react';
import { fetchCells, deleteCell } from '../../services/cellService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Plus, Edit2, Trash2, Users, Search, MoreVertical, ExternalLink, ShieldAlert, CheckCircle } from 'lucide-react';

const CellAdminManagement = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCells = async () => {
      try {
        if (userData) {
          const data = await fetchCells(userData);
          setCells(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCells();
  }, [userData]);

  const handleDelete = async (id) => {
    if (window.confirm("Excluir esta célula?")) {
      try {
        await deleteCell(id);
        setCells(cells.filter(c => c.id !== id));
      } catch (err) {
        alert("Erro ao excluir.");
      }
    }
  };

  const filteredCells = cells.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Home size={32} color="var(--primary-color)" /> Gestão de Células
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {userData?.role === 'root' ? 'Todas as células do sistema' : 'Células da sua rede'}
          </p>
        </div>
        <button onClick={() => navigate('/admin/cells/new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Nova Célula
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Pesquisar célula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredCells.map(cell => (
            <div key={cell.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {cell.logoURL ? (
                        <img src={cell.logoURL} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <Home size={24} color="var(--primary-color)" />}
                </div>
                <div style={{ 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: cell.status === 'inativo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: cell.status === 'inativo' ? '#ef4444' : '#10b981'
                }}>
                  {cell.status === 'inativo' ? <ShieldAlert size={12} /> : <CheckCircle size={12} />}
                  {cell.status || 'ativo'}
                </div>
              </div>

              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '800' }}>{cell.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} /> Lider: {cell.leaderName || 'Pendente'}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => navigate(`/admin/cells/${cell.id}`)}
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={14} /> Detalhes
                </button>
                <button 
                  onClick={() => navigate(`/admin/cells/${cell.id}/edit`)}
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                   onClick={() => handleDelete(cell.id)}
                   style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '8px', padding: '0.6rem', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CellAdminManagement;
