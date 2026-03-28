import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Sparkles } from 'lucide-react';

export const SeedDevTool = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const seedAsLeader = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Criar Rede
      const netRef = await addDoc(collection(db, 'networks'), { 
        name: 'Rede Mockada (Teste Liderança)', 
        disciplerId: 'algum-discipulador-ficticio' 
      });

      // 2. Criar Célula
      const cellRef = await addDoc(collection(db, 'cells'), { 
        name: 'Célula de Teste Beta', 
        networkId: netRef.id, 
        leaderId: currentUser.uid, 
        address: 'Rua das Virtudes, 123' 
      });

      // 3. Criar membros falsos para essa célula
      const mockMembers = [
        { name: "João Membro", role: "member", networkId: netRef.id, cellId: cellRef.id, email: "joao@teste.com" },
        { name: "Maria Membro", role: "member", networkId: netRef.id, cellId: cellRef.id, email: "maria@teste.com" },
      ];
      for (const m of mockMembers) {
        await addDoc(collection(db, 'users'), m);
      }

      // 4. Atualizar PERFIL DO LOGADO como MOCK LEADER
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.email?.split('@')[0] || "Líder de Teste",
        email: currentUser.email,
        role: "lider",
        networkId: netRef.id,
        cellId: cellRef.id
      });
      
      alert("Sucesso! Você agora é LÍDER da Célula de Teste Beta e possui membros. Recarregue a página (F5) para ver os dados.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao injetar mocks: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const seedAsDiscipler = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Criar Rede no nome do usuario atual
      const netRef = await addDoc(collection(db, 'networks'), { 
        name: 'Rede Master de Teste', 
        disciplerId: currentUser.uid 
      });

      // 2. Criar multiplas células nesta rede
      const cell1Ref = await addDoc(collection(db, 'cells'), { name: 'Célula Alpha', networkId: netRef.id, address: 'Centro' });
      const cell2Ref = await addDoc(collection(db, 'cells'), { name: 'Célula Omega', networkId: netRef.id, address: 'Bairro Sul' });

      // 3. Criar alguns membros mistos
      await addDoc(collection(db, 'users'), { name: "Marcos Alpha Membro", role: "member", networkId: netRef.id, cellId: cell1Ref.id, email: "marcos@teste.com" });
      await addDoc(collection(db, 'users'), { name: "Lucas Omega Membro", role: "member", networkId: netRef.id, cellId: cell2Ref.id, email: "lucas@teste.com" });

      // 4. Atualizar PERFIL DO LOGADO como MOCK DISCIPLER
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.email?.split('@')[0] || "Discipulador Top",
        email: currentUser.email,
        role: "discipulador",
        networkId: netRef.id,
        cellId: null
      });
      
      alert("Sucesso! Você agora é DISCIPULADOR da Rede Master. Recarregue a página (F5) para ver as células ligadas a você.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Erro ao injetar mocks: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  // Botão pequeno quando fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Abrir Ferramenta Dev"
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(16, 185, 129, 0.4)',
          color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 9999, transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = '#10b981'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'; }}
      >
        <Sparkles size={18} />
      </button>
    );
  }

  // Painel expandido
  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', 
      background: 'rgba(0,0,0,0.9)', padding: '15px', borderRadius: '12px',
      color: 'white', display: 'flex', flexDirection: 'column', gap: '10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)', zIndex: 9999,
      maxWidth: '300px', border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>
          <Sparkles size={16} /> Ferramenta Dev
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', lineHeight: 1, fontSize: '1.1rem' }}
          title="Minimizar"
        >
          ✕
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
        Gere dados de teste (Células, Redes, Membros) para testar o sistema.
      </p>
      
      <button 
        onClick={seedAsLeader} 
        disabled={loading}
        style={{ background: '#2563eb', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: loading ? 'wait' : 'pointer' }}
      >
        <Shield size={14} /> Tornar-me "Líder"
      </button>

      <button 
        onClick={seedAsDiscipler} 
        disabled={loading}
        style={{ background: '#f59e0b', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: loading ? 'wait' : 'pointer' }}
      >
        <Shield size={14} /> Tornar-me "Discipulador"
      </button>
    </div>
  );
};
