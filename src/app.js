const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const { authMiddleware } = require('./middleware/auth');

const app = express();

app.use(express.json());

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Rota de autenticação (pública)
app.use('/auth', authRoutes);

// Rotas de pedidos (protegidas por JWT)
app.use('/order', authMiddleware, orderRoutes);

module.exports = app;
