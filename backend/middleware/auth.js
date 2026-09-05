// JWT Authentication and Multi-Tenant Isolation Middleware

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ardhnarishwar-saas-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      companyName: user.companyName,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token is invalid or expired' });
  }
}

// Check role permissions
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

// Scopes tenant requests: SUPER_ADMIN can override or pass tenantId query param; COMPANY_ADMIN is strictly locked to req.user.tenantId
function resolveTenantScope(req) {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return req.query.tenantId || req.headers['x-tenant-id'] || 'GLOBAL';
  }
  return req.user ? req.user.tenantId : 'GLOBAL';
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticate,
  requireRole,
  resolveTenantScope
};
