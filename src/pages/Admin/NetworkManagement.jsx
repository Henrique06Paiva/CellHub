import React, { useState, useEffect } from 'react';
import { fetchNetworks, deleteNetwork } from '../../services/networkService';
import { useGlobal } from '../../contexts/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { Network, Plus, Edit2, Trash2, Users, Search, Globe } from 'lucide-react';

const NetworkManagement = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader, notify } = useGlobal();
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadNetworks = async () => {
      try {
        const data = await fetchNetworks();
        setNetworks(data);
      } catch (err) {
        console.error("Erro ao redes:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNetworks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta rede? Esta ação é irreversível.")) return;

    showLoader("Excluindo rede...");
    try {
      await deleteNetwork(id);
      setNetworks(networks.filter(n => n.id !== id));
      notify('success', 'Rede excluída com sucesso.');
    } catch (err) {
      notify('error', 'Erro ao excluir rede. Verifique se há células vinculadas.');
    } finally {
      hideLoader();
    }
  };

  const filteredNetworks = networks.filter(n => 
    n.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Globe size={32} color="var(--primary-color)" /> Gestão de Redes
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Administre as redes e seus respectivos discipuladores</p>
        </div>
        <button 
          onClick={() => navigate('/admin/networks/new')} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} /> Nova Rede
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Pesquisar rede..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando redes...</p>
      ) : filteredNetworks.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredNetworks.map(net => (
            <div key={net.id} className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              {/* Background gradient hint */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: 'var(--primary-color)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {net.logoURL ? (
                    <img src={net.logoURL} alt={net.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Network size={24} color="var(--primary-color)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{net.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <Users size={14} />
                    <span>Discipulador vinculado</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => navigate(`/admin/networks/${net.id}/edit`)}
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.borderColor='var(--primary-color)'}
                  onMouseOut={e=>e.currentTarget.style.borderColor='var(--border-color)'}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(net.id)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '0.5rem', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'}
                  onMouseOut={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
          <Network size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhuma rede encontrada</h3>
          <p style={{ color: 'var(--text-muted)' }}>Comece criando a primeira rede do sistema.</p>
        </div>
      )}
    </div>
  );
};

export default NetworkManagement;
