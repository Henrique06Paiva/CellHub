/**
 * Script de limpeza: Remove TODOS os usuários exceto o ROOT (root@nexohub.com)
 * Executa limpeza no Firebase Auth E no Firestore.
 * 
 * Uso: node cleanupUsers.js
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Inicializar Firebase Admin
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

async function cleanupUsers() {
  console.log('🔍 Buscando todos os usuários no Firestore...\n');

  // 1. Buscar todos os documentos da coleção 'users'
  const usersSnapshot = await db.collection('users').get();

  let rootUid = null;
  const usersToDelete = [];

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    
    // Pula o flag de setup
    if (doc.id === 'root_setup_flag') {
      console.log(`  ⏭️  Mantendo: root_setup_flag`);
      continue;
    }

    if (data.role === 'root' || data.email === ROOT_EMAIL) {
      rootUid = doc.id;
      console.log(`  ✅ ROOT encontrado: ${data.name} (${data.email}) — UID: ${doc.id}`);
    } else {
      usersToDelete.push({ uid: doc.id, name: data.name, email: data.email });
      console.log(`  🗑️  Para deletar: ${data.name || '(sem nome)'} (${data.email || '(sem email)'}) — UID: ${doc.id}`);
    }
  }

  if (!rootUid) {
    console.error('\n❌ ERRO: Usuário ROOT não encontrado! Abortando.');
    process.exit(1);
  }

  console.log(`\n📊 Resumo: ${usersToDelete.length} usuário(s) para deletar, 1 ROOT mantido.\n`);

  if (usersToDelete.length === 0) {
    console.log('✅ Nenhum usuário extra para deletar. Banco já está limpo!');
    process.exit(0);
  }

  // 2. Deletar cada usuário do Auth e do Firestore
  for (const user of usersToDelete) {
    try {
      // Deletar do Firebase Auth
      await auth.deleteUser(user.uid);
      console.log(`  🔐 Auth deletado: ${user.email}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.log(`  ⚠️  Auth não encontrado (já removido): ${user.email}`);
      } else {
        console.error(`  ❌ Erro ao deletar Auth de ${user.email}:`, authErr.message);
      }
    }

    try {
      // Deletar do Firestore
      await db.collection('users').doc(user.uid).delete();
      console.log(`  📄 Firestore deletado: ${user.email}`);
    } catch (fsErr) {
      console.error(`  ❌ Erro ao deletar Firestore de ${user.email}:`, fsErr.message);
    }
  }

  // 3. Limpar coleções relacionadas (cells, networks, reports) — OPCIONAL
  // Descomente se quiser limpar tudo
  
  const collectionsToClean = ['cells', 'networks', 'reports'];
  for (const collName of collectionsToClean) {
    const snapshot = await db.collection(collName).get();
    if (!snapshot.empty) {
      console.log(`\n🗑️  Limpando coleção '${collName}' (${snapshot.size} documentos)...`);
      for (const doc of snapshot.docs) {
        await db.collection(collName).doc(doc.id).delete();
      }
      console.log(`  ✅ Coleção '${collName}' limpa.`);
    }
  }

  // 4. Resetar o contador de IDs
  try {
    const counterRef = db.collection('counters').doc('users');
    const counterSnap = await counterRef.get();
    if (counterSnap.exists()) {
      await counterRef.set({ lastId: 1 }); // Root = ID 1
      console.log('\n🔢 Contador de IDs resetado para 1 (Root).');
    }
  } catch (e) {
    console.log('⚠️  Não foi possível resetar o contador:', e.message);
  }

  console.log('\n🎉 Limpeza concluída! Apenas o ROOT foi mantido.');
}

cleanupUsers().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
