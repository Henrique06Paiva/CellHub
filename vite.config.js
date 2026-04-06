import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simula o navegador para testes de componentes React
    globals: true, // Permite usar 'expect' e 'describe' sem importar
    setupFiles: './src/setupTests.js', // Arquivo de configuração que inicializa o DOM de teste
  }
})
