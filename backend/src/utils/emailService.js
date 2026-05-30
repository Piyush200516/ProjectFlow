const nodemailer = require('nodemailer');

const hasValue = (value) => Boolean(String(value || '').trim());

const getSmtpDiagnostics = () => ({
  SMTP_HOST: hasValue(process.env.SMTP_HOST),
  SMTP_PORT: hasValue(process.env.SMTP_PORT),
  SMTP_USER: hasValue(process.env.SMTP_USER),
  SMTP_FROM: hasValue(process.env.SMTP_FROM),
  SMTP_PASS: hasValue(process.env.SMTP_PASS),
});

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass || !process.env.SMTP_FROM) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
};

const logSendMailError = (error) => {
  console.error('[MAIL] sendMail error', {
    smtpEnv: getSmtpDiagnostics(),
    message: error.message,
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
    response: error.response,
  });
};

const verifySmtpTransporter = async () => {
  console.log('[MAIL] SMTP_ENV', getSmtpDiagnostics());

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[MAIL] transporter.verify success');
    return { success: true };
  } catch (error) {
    console.error('[MAIL] transporter.verify error', {
      smtpEnv: getSmtpDiagnostics(),
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
    });
    return { success: false, error };
  }
};

const sendPasswordResetEmail = async ({ to, fullName, resetLink }) => {
  console.log('[MAIL] SMTP_ENV', getSmtpDiagnostics());

  const transporter = createTransporter();
  let info;

  try {
    info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'ProjectFlow password reset',
      text: [
        `Hi ${fullName || 'there'},`,
        '',
        'Use this link to reset your ProjectFlow password:',
        resetLink,
        '',
        'This link expires in 30 minutes. If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>Hi ${fullName || 'there'},</p>
        <p>Use this link to reset your ProjectFlow password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      `,
    });
  } catch (error) {
    logSendMailError(error);
    throw error;
  }

  console.log('[MAIL] sendMail success', {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });

  return info;
};

const sendEmailVerification = async ({ to, fullName, verificationLink }) => {
  console.log('[MAIL] SMTP_ENV', getSmtpDiagnostics());

  const transporter = createTransporter();
  let info;

  try {
    info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'Verify your ProjectFlow email',
      text: [
        `Hi ${fullName || 'there'},`,
        '',
        'Verify your ProjectFlow account using this link:',
        verificationLink,
        '',
        'This link expires in 24 hours.',
      ].join('\n'),
      html: `
        <p>Hi ${fullName || 'there'},</p>
        <p>Verify your ProjectFlow account using this link:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (error) {
    logSendMailError(error);
    throw error;
  }

  console.log('[MAIL] sendMail success', {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });

  return info;
};

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerification,
  getSmtpDiagnostics,
  verifySmtpTransporter,
};
