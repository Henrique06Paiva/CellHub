/**
 * Lista TODAS as contas no Firebase Auth e deleta as que NÃO existem no Firestore.
 * Isso limpa contas "fantasma" criadas pelo bug do reset de senha.
 * 
 * Uso: node cleanupAuthGhosts.js
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const keyPath = path.resolve('./serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

const ROOT_EMAIL = 'root@nexohub.com';

async function cleanupGhosts() {
  console.log('🔍 Listando TODAS as contas do Firebase Auth...\n');

  // Firebase Auth listUsers pega em lotes de até 1000
  let nextPageToken;
  let totalAuth = 0;
  let totalDeleted = 0;
  let rootFound = false;

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    
    for (const userRecord of listResult.users) {
      totalAuth++;
      const uid = userRecord.uid;
      const email = userRecord.email || '(sem email)';

      // Protege o Root
      if (email === ROOT_EMAIL) {
        console.log(`  ✅ ROOT mantido: ${email} (${uid})`);
        rootFound = true;
        continue;
      }

      // Verifica se existe no Firestore
      const firestoreDoc = await db.collection('users').doc(uid).get();
      
      if (!firestoreDoc.exists) {
        // Conta fantasma! Existe no Auth mas não no Firestore
        console.log(`  👻 FANTASMA encontrado: ${email} (${uid}) — Deletando...`);
        try {
          await auth.deleteUser(uid);
          totalDeleted++;
          console.log(`     ✅ Deletado do Auth.`);
        } catch (e) {
          console.error(`     ❌ Erro ao deletar: ${e.message}`);
        }
      } else {
        console.log(`  📋 Válido: ${email} (${uid})`);
      }
    }

    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  console.log(`\n📊 Resumo:`);
  console.log(`   Total de contas no Auth: ${totalAuth}`);
  console.log(`   Fantasmas deletados: ${totalDeleted}`);
  console.log(`   Root encontrado: ${rootFound ? 'Sim ✅' : 'NÃO ❌'}`);
  console.log('\n🎉 Limpeza de fantasmas concluída!');
}

cleanupGhosts().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
