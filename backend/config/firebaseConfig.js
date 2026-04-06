import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let serviceAccount;

try {
  // Lê do arquivo local em desenvolvimento (você precisará baixar do console do Firebase depois!)
  const keyPath = path.resolve('./serviceAccountKey.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Para produção usando string em Base64 configurada na Render/Railway
    serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
  }
} catch (error) {
  console.error('Erro ao ler a service account do Firebase:', error);
}

// Previne reinicialização caso o Express faça soft reloads
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} else if (!serviceAccount) {
  console.warn('⚠️ AVISO: firebase-admin não inicializou. Faltando arquivo serviceAccountKey.json ou env var.');
}

// Exportamos instâncias prontas para acessar DB e Autenticação pelo Node
export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export default admin;
