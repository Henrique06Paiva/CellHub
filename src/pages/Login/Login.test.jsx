import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as AuthContext from '../../contexts/AuthContext';
import * as FirebaseAuth from 'firebase/auth';

// Dublês de Ação (Mocks) para espiar o que acontece por baixo dos panos sem ativar internet
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

// Fantasiando o Navegador (React Router)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Isolando nosso componente das Nuvens Reais (Firebase)
vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  auth: {},
}));

describe('🔒 Suite de Testes: Tela de Login', () => {
  
  beforeEach(() => {
    vi.clearAllMocks(); // Limpa estado jogado pelas simulações anteriores
    
    // Cria estado Falso: Deslogado
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      currentUser: null,
      userData: null,
      loading: false,
    });
  });

  it('1️⃣ Deve renderizar os inputs e o botão primário visivelmente na TELA', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('2️⃣ UX Defense: Mostra ALERTA VERMELHO e barra requisições se campos estiverem VAZIOS', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton); // O robô clica igual um usuário apressado
    
    // Vitest averigua se o front-end segurou as pontas sozinho
    expect(await screen.findByText('Por favor, informe o seu e-mail.')).toBeInTheDocument();
    expect(await screen.findByText('A senha é obrigatória.')).toBeInTheDocument();
    
    // Prova Definitiva: Como faltou preencher, a requisição para a API *nem foi chamada*! Otimização perfeita.
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('3️⃣ Sucesso: Encaminha Credenciais exatas para a Base Confidencial do Firebase', async () => {
    mockLogin.mockResolvedValueOnce({}); // Responde pro React que a senha bateu!
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // O robô preenche campos
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'henrique@nexohub.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senhaSegura!99' } });
    
    // O robô pressiona entrar
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
       // O Firebase recebeu a propina da senha validamente? SIM.
       expect(mockLogin).toHaveBeenCalledWith('henrique@nexohub.com', 'senhaSegura!99');
    });
  });
});
