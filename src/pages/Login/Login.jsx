import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, UserCircle2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para erros detalhados
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    if (!email.trim()) {
      setEmailError('Por favor, informe o seu e-mail.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('O e-mail informado não é válido.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('A senha é obrigatória.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Erro de Autenticação:', err);
      
      // Mapeando erros visuais elegantes e focados no usuário final
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setAuthError('E-mail ou senha incorretos. Verifique e tente novamente.');
          break;
        case 'auth/invalid-email':
          setAuthError('O endereço de e-mail fornecido não é válido.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Muitas tentativas falhas. Por segurança, aguarde alguns minutos.');
          break;
        case 'auth/network-request-failed':
          setAuthError('Sem conexão. Verifique sua internet e tente novamente.');
          break;
        case 'auth/configuration-not-found':
          setAuthError('Configuração pendente: Ative o provedor de "E-mail/Senha" no Firebase Console.');
          break;
        default:
          // Esconde a mensagem feia do Firebase e mostra algo amigável para qualquer outro erro misterioso
          setAuthError('Não foi possível entrar no sistema agora. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e0eaf5 100%)', 
      width: '100vw', 
      padding: '2rem' 
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        padding: '3.5rem 3rem', 
        maxWidth: '440px', 
        width: '100%', 
        textAlign: 'center',
        background: '#ffffff',
        boxShadow: '0 20px 40px rgba(37, 99, 235, 0.08)'
      }}>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '1rem', 
          color: 'var(--primary-color)',
          background: 'rgba(37, 99, 235, 0.05)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          alignItems: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <UserCircle2 size={42} strokeWidth={1.5} />
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>CellHub</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Acesse a plataforma de gerenciamento
        </p>

        {authError && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.85rem', 
            background: '#fef2f2', 
            color: 'var(--danger-color)', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            justifyContent: 'center',
            fontSize: '0.9rem',
            border: '1px solid #fecaca',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle size={18} /> {authError}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: emailError ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1rem 0.85rem 2.8rem',
                  background: '#f8fafc',
                  borderColor: emailError ? 'var(--danger-color)' : 'var(--border-color)',
                  boxShadow: emailError ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : 'none'
                }}
              />
            </div>
            {emailError && (
              <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {emailError}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: passwordError ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1rem 0.85rem 2.8rem',
                  background: '#f8fafc',
                  borderColor: passwordError ? 'var(--danger-color)' : 'var(--border-color)',
                  boxShadow: passwordError ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : 'none'
                }}
              />
            </div>
            {passwordError && (
              <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {passwordError}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              padding: '0.85rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Validando...' : (
              <>Entrar <ArrowRight size={18} /></>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
