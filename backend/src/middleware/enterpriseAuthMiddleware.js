const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');
const redis = require('../config/redis');

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req) || req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const cachedUserId = await redis.get(`session:${payload.sessionId}`).catch(() => null);
    if (cachedUserId && cachedUserId !== String(payload.sub)) {
      return res.status(401).json({ message: 'Session invalid' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Session invalid' });
    }

    req.user = {
      ...user,
      role: String(user.role || '').toUpperCase(),
    };
    req.sessionId = payload.sessionId;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
};

const requireRoles = (...roles) => {
  const allowedRoles = roles.map((role) => String(role || '').toUpperCase());
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(String(req.user.role || '').toUpperCase())) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
};

module.exports = {
  requireAuth,
  requireRoles,
};
