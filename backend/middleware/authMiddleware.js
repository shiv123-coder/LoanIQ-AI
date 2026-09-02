const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production_123';

const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, etc. }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }
};

const verifyStaff = (req, res, next) => {
  verifyToken(req, res, () => {
    const role = req.user?.role?.toLowerCase();
    const isOfficer = ['loan_officer', 'loanofficer', 'officer'].includes(role);
    if (req.user && (role === 'admin' || isOfficer)) {
      next();
    } else {
      return res.status(403).json({ success: false, error: 'Forbidden: Staff access required' });
    }
  });
};

const verifyAdminOnly = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ success: false, error: 'Forbidden: Administrator access required' });
    }
  });
};

module.exports = { generateToken, verifyToken, verifyStaff, verifyAdminOnly };
