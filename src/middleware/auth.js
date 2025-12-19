const jwt = require('jsonwebtoken');

function authRequired(jwtSecret) {
  return function (req, res, next) {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

function requireRole(roles) {
  const allow = new Set(roles);
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role || !allow.has(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authRequired, requireRole };
