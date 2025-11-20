const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: true, message: 'No token provided' });
  }

  // Support both "Bearer token" and just "token"
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;