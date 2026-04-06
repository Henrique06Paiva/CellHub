import fs from 'fs';

try {
  const fileData = fs.readFileSync('serviceAccountKey.json');
  const base64String = fileData.toString('base64');
  
  fs.writeFileSync('base64-key-for-render.txt', base64String);
  console.log('✅ Sucesso! O arquivo base64-key-for-render.txt foi criado.');
  console.log('Abra o arquivo, copie aquele textão e cole lá no Render na variável FIREBASE_SERVICE_ACCOUNT.');
  console.log('Depois de colar lá, você pode apagar o txt por segurança!');
} catch (error) {
  console.error('❌ Erro: Certifique-se de que o serviceAccountKey.json está aqui na mesma pasta.', error.message);
}
