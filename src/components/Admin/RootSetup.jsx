import React, { useEffect } from 'react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '../../lib/firebase';

const RootSetup = () => {
  useEffect(() => {
    const setup = async () => {
      const rootEmail = 'root@nexohub.com';
      const rootPass = 'radicaislivres2026';

      try {
        // 1. Verificar se o root já existe no Firestore para evitar loops
        const checkDoc = await getDoc(doc(db, 'users', 'root_setup_flag'));
        if (checkDoc.exists()) return;

        console.log("Iniciando criação do usuário Root...");

        // 2. Criar no Auth usando App Secundário (para não deslogar ninguém)
        let secondaryApp;
        try {
          secondaryApp = getApp("SecondarySetup");
        } catch(e) {
          secondaryApp = initializeApp(firebaseConfig, "SecondarySetup");
        }
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, rootEmail, rootPass);
        const uid = userCredential.user.uid;

        // 3. Criar no Firestore com permissão ROOT
        await setDoc(doc(db, 'users', uid), {
          name: 'Administrador Nexo',
          email: rootEmail,
          role: 'root',
          status: 'ativo',
          createdAt: serverTimestamp()
        });

        // 4. Marcar como concluído
        await setDoc(doc(db, 'users', 'root_setup_flag'), { completed: true });

        await signOut(secondaryAuth);
        console.log("Usuário ROOT criado com sucesso!");
        alert("Usuário ROOT criado! Use root@nexohub.com / radicaislivres2026 para acessar.");
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log("Usuário Root já existe no Auth.");
          await setDoc(doc(db, 'users', 'root_setup_flag'), { completed: true });
        } else {
          console.error("Erro no RootSetup:", err);
        }
      }
    };

    setup();
  }, []);

  return null;
};

export default RootSetup;
