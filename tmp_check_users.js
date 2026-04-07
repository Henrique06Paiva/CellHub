import { db } from './backend/config/firebaseConfig.js';

async function checkUsers() {
  try {
    const snapshot = await db.collection('users').get();
    console.log("--- Lista de Usuários no DB ---");
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id} | Nome: ${data.name} | Email: ${data.email} | Role: ${data.role}`);
    });
    console.log("--- Fim da Lista ---");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
