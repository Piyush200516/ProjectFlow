const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const prisma = require('../config/prisma');
const { addDays, createOpaqueToken, sha256 } = require('../utils/cryptoTokens');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return process.env.JWT_SECRET;
};

const signAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      sub: String(user.id),
      sessionId,
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

const createSession = async ({ user, req }) => {
  const refreshToken = createOpaqueToken(48);
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = addDays(new Date(), REFRESH_TOKEN_DAYS);

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      ipAddress: req?.ip || req?.socket?.remoteAddress || null,
      userAgent: req?.headers?.['user-agent'] || null,
    },
  });

  const accessToken = signAccessToken(user, session.id);
  await redis.set(`session:${session.id}`, String(user.id), 'EX', REFRESH_TOKEN_DAYS * 24 * 60 * 60).catch(() => null);

  return {
    accessToken,
    refreshToken,
    session,
  };
};

const rotateSession = async ({ refreshToken, req }) => {
  const refreshTokenHash = sha256(refreshToken);
  const session = await prisma.userSession.findUnique({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!session || session.isRevoked || session.expiresAt <= new Date()) {
    throw new Error('Invalid refresh token');
  }

  const nextRefreshToken = createOpaqueToken(48);
  const nextRefreshTokenHash = sha256(nextRefreshToken);
  const nextExpiresAt = addDays(new Date(), REFRESH_TOKEN_DAYS);

  const nextSession = await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: nextRefreshTokenHash,
      expiresAt: nextExpiresAt,
      ipAddress: req?.ip || req?.socket?.remoteAddress || session.ipAddress,
      userAgent: req?.headers?.['user-agent'] || session.userAgent,
    },
    include: { user: true },
  });

  await redis.set(`session:${nextSession.id}`, String(nextSession.userId), 'EX', REFRESH_TOKEN_DAYS * 24 * 60 * 60).catch(() => null);

  return {
    accessToken: signAccessToken(nextSession.user, nextSession.id),
    refreshToken: nextRefreshToken,
    session: nextSession,
  };
};

const revokeSession = async (sessionId) => {
  await prisma.userSession.updateMany({
    where: { id: sessionId, isRevoked: false },
    data: { isRevoked: true, revokedAt: new Date() },
  });
  await redis.del(`session:${sessionId}`).catch(() => null);
};

module.exports = {
  signAccessToken,
  createSession,
  rotateSession,
  revokeSession,
};
