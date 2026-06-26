const bcrypt = require('bcryptjs');

const prisma = require('../config/prisma');
const redis = require('../config/redis');
const { createSession, rotateSession, revokeSession } = require('./sessionService');
const { writeAuditLog } = require('./auditService');
const { addMinutes, addDays, createOpaqueToken, sha256 } = require('../utils/cryptoTokens');
const { sendPasswordResetEmail, sendEmailVerification } = require('../utils/emailService');

const LOCKOUT_LIMIT = Number(process.env.AUTH_LOCKOUT_LIMIT || 5);
const LOCKOUT_MINUTES = Number(process.env.AUTH_LOCKOUT_MINUTES || 15);
const PASSWORD_RESET_MINUTES = Number(process.env.PASSWORD_RESET_MINUTES || 30);
const EMAIL_VERIFICATION_HOURS = Number(process.env.EMAIL_VERIFICATION_HOURS || 24);

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: String(user.role || '').toUpperCase(),
  isActive: user.isActive,
  emailVerifiedAt: user.emailVerifiedAt,
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const frontendUrl = () => (process.env.FRONTEND_URL || 'https://projectflow-auth.vercel.app').replace(/\/+$/, '');

const register = async ({ payload, req }) => {
  const email = normalizeEmail(payload.email);
  const role = String(payload.role || 'STUDENT').trim().toLowerCase();

  if (!email || !payload.password || !payload.fullName) {
    const error = new Error('fullName, email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: payload.fullName.trim(),
      role,
      studentProfile: role === 'student' && payload.rollNumber ? {
        create: {
          rollNumber: payload.rollNumber,
          branchId: payload.branchId ? Number(payload.branchId) : null,
          semester: Number(payload.semester || 6),
          section: payload.section || null,
          subsection: payload.subsection || null,
          academicYear: payload.academicYear || null,
        },
      } : undefined,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: 'AUTH_REGISTER',
    entityType: 'User',
    entityId: user.id,
    req,
    metadata: { role },
  });

  await sendVerificationEmail({ email, req, actorId: user.id }).catch((error) => {
    console.error('[AUTH] verification email failed:', error.message);
  });

  return publicUser(user);
};

const login = async ({ email, password, req }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    await prisma.loginAttempt.create({
      data: { email: normalizedEmail, success: false, reason: 'USER_NOT_FOUND', ipAddress: req?.ip || null },
    });
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is inactive');
    error.statusCode = 403;
    throw error;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const error = new Error('Account is temporarily locked');
    error.statusCode = 423;
    throw error;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  await prisma.loginAttempt.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      success: match,
      reason: match ? null : 'BAD_PASSWORD',
      ipAddress: req?.ip || null,
    },
  });

  if (!match) {
    const failedLoginCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount,
        lockedUntil: failedLoginCount >= LOCKOUT_LIMIT ? addMinutes(new Date(), LOCKOUT_MINUTES) : null,
      },
    });
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const cleanUser = await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLogin: new Date() },
  });

  const session = await createSession({ user: cleanUser, req });
  await writeAuditLog({
    actorId: cleanUser.id,
    action: 'AUTH_LOGIN',
    entityType: 'UserSession',
    entityId: session.session.id,
    req,
  });

  return {
    user: publicUser(cleanUser),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

const refresh = async ({ refreshToken, req }) => {
  const session = await rotateSession({ refreshToken, req });
  return {
    user: publicUser(session.session.user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

const logout = async ({ sessionId, actorId, req }) => {
  if (sessionId) {
    await revokeSession(sessionId);
  }
  await writeAuditLog({
    actorId,
    action: 'AUTH_LOGOUT',
    entityType: 'UserSession',
    entityId: sessionId,
    req,
  });
};

const sendPasswordReset = async ({ email, req }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    const error = new Error('No active account found for this email');
    error.statusCode = 404;
    throw error;
  }

  const token = createOpaqueToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: addMinutes(new Date(), PASSWORD_RESET_MINUTES),
    },
  });

  const resetLink = `${frontendUrl()}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetLink });
  await writeAuditLog({
    actorId: user.id,
    action: 'AUTH_PASSWORD_RESET_REQUESTED',
    entityType: 'User',
    entityId: user.id,
    req,
  });
};

const resetPassword = async ({ email, token, password, req }) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    const error = new Error('Invalid reset token');
    error.statusCode = 400;
    throw error;
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash: sha256(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetToken) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.userSession.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    }),
  ]);

  await redis.del(`session:${user.id}`).catch(() => null);
  await writeAuditLog({
    actorId: user.id,
    action: 'AUTH_PASSWORD_RESET_COMPLETED',
    entityType: 'User',
    entityId: user.id,
    severity: 'WARNING',
    req,
  });
};

const sendVerificationEmail = async ({ email, req, actorId = null }) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const token = createOpaqueToken(32);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: addDays(new Date(), EMAIL_VERIFICATION_HOURS / 24),
    },
  });

  const verificationLink = `${frontendUrl()}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendEmailVerification({ to: user.email, fullName: user.fullName, verificationLink });
  await writeAuditLog({
    actorId: actorId || user.id,
    action: 'AUTH_EMAIL_VERIFICATION_REQUESTED',
    entityType: 'User',
    entityId: user.id,
    req,
  });
};

const verifyEmail = async ({ email, token, req }) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    const error = new Error('Invalid verification token');
    error.statusCode = 400;
    throw error;
  }

  const verificationToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      tokenHash: sha256(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    const error = new Error('Invalid or expired verification token');
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } }),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: 'AUTH_EMAIL_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    req,
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendPasswordReset,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  publicUser,
};
