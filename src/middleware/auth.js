const jwt = require('jsonwebtoken');

const SECRET = 'desafio-jitterbit-secret';

// Gera um token JWT
function generateToken(user) {
  return jwt.sign({ user }, SECRET, { expiresIn: '1h' });
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { generateToken, authMiddleware, SECRET };
