import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

async function fixUser() {
  try {
    const emailToFix = 'henriqueesteves06@gmail.com';
    const networkId = 'HvziwtxCxvd65kJhON66';
    
    // Como o script está na pasta backend, a chave está ao lado
    const keyPath = path.resolve('./serviceAccountKey.json');

    if (!fs.existsSync(keyPath)) {
      console.error("[ERRO] Arquivo serviceAccountKey.json não encontrado na pasta backend.");
      process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    
    console.log(`[FIX] Buscando usuário ${emailToFix}...`);
    const userSnapshot = await db.collection('users').where('email', '==', emailToFix).get();
    
    if (userSnapshot.empty) {
      console.error("[ERRO] Usuário não encontrado no Firestore.");
      process.exit(1);
    }
    
    const userDoc = userSnapshot.docs[0];
    console.log(`[FIX] Usuário encontrado: ${userDoc.id}. Atualizando para Rede Hopeland...`);
    
    await userDoc.ref.update({
      role: 'discipulador',
      networkId: networkId,
      networkName: 'Rede Hopeland',
      status: 'ativo'
    });
    
    console.log("[SUCESSO] Usuário Henrique sincronizado!");
    process.exit(0);
  } catch (err) {
    console.error("[ERRO]", err);
    process.exit(1);
  }
}

fixUser();
