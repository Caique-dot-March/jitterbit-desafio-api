const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { pool, initDatabase } = require('../src/database');

let server;
let token;
const BASE = 'http://localhost:3001';

function request(method, path, body, authToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Autenticação', () => {
  before(async () => {
    await initDatabase();
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM orders');
    server = app.listen(3001);
  });

  after(async () => {
    server.close();
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM orders');
    await pool.end();
  });

  it('deve retornar 401 com credenciais inválidas', async () => {
    const res = await request('POST', '/auth/login', { username: 'wrong', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });

  it('deve gerar token com credenciais válidas', async () => {
    const res = await request('POST', '/auth/login', { username: 'admin', password: 'admin' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    token = res.body.token;
  });

  it('deve retornar 401 sem token nas rotas protegidas', async () => {
    const res = await request('GET', '/order/list');
    assert.strictEqual(res.status, 401);
  });

  const pedido = {
    numeroPedido: 'v10089015vdb-01',
    valorTotal: 10000,
    dataCriacao: '2023-07-19T12:24:11.5299601+00:00',
    items: [
      { idItem: '2434', quantidadeItem: 1, valorItem: 1000 },
    ],
  };

  it('deve criar um novo pedido (POST /order)', async () => {
    const res = await request('POST', '/order', pedido, token);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.order.orderId, 'v10089015vdb-01');
    assert.strictEqual(res.body.order.value, 10000);
    assert.strictEqual(res.body.order.items[0].productId, 2434);
  });

  it('não deve criar pedido duplicado', async () => {
    const res = await request('POST', '/order', pedido, token);
    assert.strictEqual(res.status, 409);
  });

  it('deve retornar erro com campos faltando', async () => {
    const res = await request('POST', '/order', { numeroPedido: '' }, token);
    assert.strictEqual(res.status, 400);
  });

  it('deve obter um pedido pelo número (GET /order/:orderId)', async () => {
    const res = await request('GET', '/order/v10089015vdb-01', null, token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.orderId, 'v10089015vdb-01');
    assert.strictEqual(res.body.value, 10000);
    assert.strictEqual(res.body.items.length, 1);
  });

  it('deve retornar 404 para pedido inexistente', async () => {
    const res = await request('GET', '/order/inexistente', null, token);
    assert.strictEqual(res.status, 404);
  });

  it('deve listar todos os pedidos (GET /order/list)', async () => {
    const res = await request('GET', '/order/list', null, token);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
  });

  it('deve atualizar um pedido (PUT /order/:orderId)', async () => {
    const atualizado = {
      numeroPedido: 'v10089015vdb-01',
      valorTotal: 20000,
      dataCriacao: '2023-08-01T10:00:00+00:00',
      items: [
        { idItem: '5555', quantidadeItem: 3, valorItem: 2000 },
      ],
    };
    const res = await request('PUT', '/order/v10089015vdb-01', atualizado, token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.order.value, 20000);
    assert.strictEqual(res.body.order.items[0].productId, 5555);
  });

  it('deve retornar 404 ao atualizar pedido inexistente', async () => {
    const res = await request('PUT', '/order/inexistente', pedido, token);
    assert.strictEqual(res.status, 404);
  });

  it('deve deletar um pedido (DELETE /order/:orderId)', async () => {
    const res = await request('DELETE', '/order/v10089015vdb-01', null, token);
    assert.strictEqual(res.status, 200);

    const check = await request('GET', '/order/v10089015vdb-01', null, token);
    assert.strictEqual(check.status, 404);
  });

  it('deve retornar 404 ao deletar pedido inexistente', async () => {
    const res = await request('DELETE', '/order/inexistente', null, token);
    assert.strictEqual(res.status, 404);
  });
});
