const app = require('./src/app');
const { initDatabase } = require('./src/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error.message || error);
    console.error('Stack:', error.stack);
    console.error('DATABASE_URL definida:', !!process.env.DATABASE_URL);
    process.exit(1);
  }
}

start();
