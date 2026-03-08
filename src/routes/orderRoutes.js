const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Faz o mapping dos campos do body para o formato do banco
function mapOrderBody(body) {
  const date = new Date(body.dataCriacao);
  return {
    orderId: body.numeroPedido,
    value: body.valorTotal,
    creationDate: isNaN(date.getTime()) ? null : date.toISOString(),
    items: (body.items || []).map(item => ({
      productId: parseInt(item.idItem),
      quantity: item.quantidadeItem,
      price: item.valorItem,
    })),
  };
}

// POST /order - Criar um novo pedido
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const order = mapOrderBody(req.body);

    if (!order.orderId || !order.value || !order.creationDate) {
      return res.status(400).json({ error: 'Campos obrigatórios: numeroPedido, valorTotal, dataCriacao' });
    }

    await client.query('BEGIN');

    await client.query(
      'INSERT INTO orders ("orderId", value, "creationDate") VALUES ($1, $2, $3)',
      [order.orderId, order.value, order.creationDate]
    );

    for (const item of order.items) {
      await client.query(
        'INSERT INTO items ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)',
        [order.orderId, item.productId, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Pedido já existe com este número' });
    }
    console.error('Erro ao criar pedido:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// GET /order/list - Listar todos os pedidos
router.get('/list', async (req, res) => {
  try {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY "creationDate" DESC');
    const orders = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await pool.query('SELECT "productId", quantity, price FROM items WHERE "orderId" = $1', [order.orderId]);
      orders.push({
        orderId: order.orderId,
        value: parseFloat(order.value),
        creationDate: order.creationDate,
        items: itemsResult.rows.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: parseFloat(i.price),
        })),
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /order/:orderId - Obter um pedido pelo número
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query('SELECT * FROM orders WHERE "orderId" = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query('SELECT "productId", quantity, price FROM items WHERE "orderId" = $1', [orderId]);

    res.json({
      orderId: order.orderId,
      value: parseFloat(order.value),
      creationDate: order.creationDate,
      items: itemsResult.rows.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: parseFloat(i.price),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /order/:orderId - Atualizar um pedido
router.put('/:orderId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const order = mapOrderBody(req.body);

    const existing = await client.query('SELECT * FROM orders WHERE "orderId" = $1', [orderId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await client.query('BEGIN');

    await client.query(
      'UPDATE orders SET value = $1, "creationDate" = $2 WHERE "orderId" = $3',
      [order.value, order.creationDate, orderId]
    );

    // Remove itens antigos e insere os novos
    await client.query('DELETE FROM items WHERE "orderId" = $1', [orderId]);
    for (const item of order.items) {
      await client.query(
        'INSERT INTO items ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Pedido atualizado com sucesso', order: { ...order, orderId } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar pedido:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// DELETE /order/:orderId - Deletar um pedido
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query('DELETE FROM orders WHERE "orderId" = $1 RETURNING *', [orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pedido:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
