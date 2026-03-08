const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');

// POST /auth/login - Gera um token JWT
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Autenticação simples para fins de demonstração
  if (username === 'admin' && password === 'admin') {
    const token = generateToken(username);
    return res.json({ token });
  }

  res.status(401).json({ error: 'Credenciais inválidas' });
});

module.exports = router;
