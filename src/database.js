const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'desafio_api',
  user: 'api_user',
  password: 'api123',
});

// Cria as tabelas ao iniciar
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        "orderId" VARCHAR(100) PRIMARY KEY,
        value NUMERIC(10, 2) NOT NULL,
        "creationDate" TIMESTAMPTZ NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        "orderId" VARCHAR(100) NOT NULL REFERENCES orders("orderId") ON DELETE CASCADE,
        "productId" INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
