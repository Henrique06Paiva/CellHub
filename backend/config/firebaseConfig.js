import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let serviceAccount;

try {
  // Lê do arquivo local em desenvolvimento
  const keyPath = path.resolve('./serviceAccountKey.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log('✅ Service Account carregada do arquivo local.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Para produção usando string em Base64 configurada na Render/Railway
    console.log(`📦 Env var FIREBASE_SERVICE_ACCOUNT encontrada (${process.env.FIREBASE_SERVICE_ACCOUNT.length} chars).`);
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
    console.log('✅ Service Account carregada da env var (base64).');
  } else {
    console.warn('❌ Nem o arquivo serviceAccountKey.json nem a env var FIREBASE_SERVICE_ACCOUNT foram encontrados.');
    console.warn('   Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ') || '(nenhuma com FIREBASE)');
  }
} catch (error) {
  console.error('❌ Erro ao ler a service account do Firebase:', error.message);
}

// Previne reinicialização caso o Express faça soft reloads
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔥 Firebase Admin SDK inicializado com sucesso.');
} else if (!serviceAccount) {
  console.warn('⚠️ AVISO: firebase-admin não inicializou. Faltando arquivo serviceAccountKey.json ou env var.');
}

// Exportamos instâncias prontas para acessar DB e Autenticação pelo Node
export const db = admin.apps.length ? admin.firestore() : null;
if (db) {
  db.settings({ preferRest: true });
}
export const auth = admin.apps.length ? admin.auth() : null;
export default admin;
