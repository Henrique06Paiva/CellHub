import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApp } from 'firebase/app';
import { auth, db, firebaseConfig } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // role, cellId, networkId
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Criação Inteligente: Instancia app paralelo para criar o auth sem deslogar admin
  const registerUserFromAdmin = async (userData) => {
    let secondaryApp;
    try {
      secondaryApp = getApp("Secondary");
    } catch(e) {
      secondaryApp = initializeApp(firebaseConfig, "Secondary");
    }
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // Cria senha forte aleatória que o usuário nunca vai ver, porque vai redefinir
      const tempPassword = Math.random().toString(36).slice(-8) + 'X8@!';
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, tempPassword);
      const newUserId = userCredential.user.uid;

      // Salva dados no banco Principal
      await setDoc(doc(db, 'users', newUserId), {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        age: userData.age || '',
        cep: userData.cep || '',
        role: userData.role || 'membro',
        cellId: userData.cellId || null,
        cellName: userData.cellName || null,
        networkId: userData.networkId || null,
        status: 'ativo',
        createdAt: serverTimestamp()
      });

      // Dispara email de Reset Password para o novo usuário configurar o 1o acesso
      await sendPasswordResetEmail(auth, userData.email);
      
      // Encerra a sessão lixo no app paralelo
      await signOut(secondaryAuth);
      return newUserId;
    } catch(error) {
      console.error("Erro na criação secundária:", error);
      throw error;
    }
  };

  async function register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name: name || email.split('@')[0],
      email: email,
      role: 'member',
      createdAt: new Date().toISOString()
    });
    return cred;
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Busca os dados adicionais com o RBAC do Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            console.error("Documento do usuário não encontrado no Firestore.");
            setUserData(null);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUserData(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData, // { role: 'membro' | 'lider' | 'discipulador', cellId, networkId }
    loading,
    login,
    register,
    registerUserFromAdmin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
