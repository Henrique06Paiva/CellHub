import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let serviceAccount;

console.log(`🕒 Server Time: ${new Date().toString()}`);

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // RECOMENDADO: Prioriza variável de ambiente (base64) para deploy seguro
    console.log(`📦 Usando FIREBASE_SERVICE_ACCOUNT da env var (${process.env.FIREBASE_SERVICE_ACCOUNT.length} chars).`);
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
    console.log('✅ Service Account carregada e parseada com sucesso da env var.');
  } else {
    // Fallback para arquivo local (desenvolvimento)
    const keyPath = path.resolve('./serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      console.log('✅ Service Account carregada do arquivo local (fallback).');
    } else {
      console.warn('❌ NENHUMA CREDENCIAL ENCONTRADA (Env var ou arquivo).');
    }
  }
} catch (error) {
  console.error('❌ Erro crítico ao processar credenciais:', error.message);
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
