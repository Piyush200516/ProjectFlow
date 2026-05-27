const authService = require('../services/enterpriseAuthService');

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 30) * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
};

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('[AUTH_V2]', error.message);
    res.status(status).json({ message: status === 500 ? 'Authentication service error' : error.message });
  }
};

exports.register = handle(async (req, res) => {
  const user = await authService.register({ payload: req.body, req });
  res.status(201).json({ success: true, user });
});

exports.login = handle(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    req,
  });
  setAuthCookies(res, result);
  res.json({ success: true, user: result.user, accessToken: result.accessToken });
});

exports.refresh = handle(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }
  const result = await authService.refresh({ refreshToken, req });
  setAuthCookies(res, result);
  return res.json({ success: true, user: result.user, accessToken: result.accessToken });
});

exports.logout = handle(async (req, res) => {
  await authService.logout({ sessionId: req.sessionId, actorId: req.user?.id, req });
  clearAuthCookies(res);
  res.json({ success: true });
});

exports.me = handle(async (req, res) => {
  res.json({ user: req.user });
});

exports.forgotPassword = handle(async (req, res) => {
  await authService.sendPasswordReset({ email: req.body.email, req });
  res.json({ success: true, message: 'Recovery link sent' });
});

exports.resetPassword = handle(async (req, res) => {
  await authService.resetPassword({
    email: req.body.email,
    token: req.body.token,
    password: req.body.password,
    req,
  });
  res.json({ success: true, message: 'Password reset complete' });
});

exports.sendVerification = handle(async (req, res) => {
  await authService.sendVerificationEmail({ email: req.body.email, req, actorId: req.user?.id });
  res.json({ success: true, message: 'Verification email sent' });
});

exports.verifyEmail = handle(async (req, res) => {
  await authService.verifyEmail({ email: req.body.email, token: req.body.token, req });
  res.json({ success: true, message: 'Email verified' });
});
