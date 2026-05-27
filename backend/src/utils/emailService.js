const nodemailer = require('nodemailer');

const hasValue = (value) => Boolean(String(value || '').trim());

const getSmtpDiagnostics = () => ({
  SMTP_HOST: hasValue(process.env.SMTP_HOST),
  SMTP_USER: hasValue(process.env.SMTP_USER),
  SMTP_FROM: hasValue(process.env.SMTP_FROM),
});

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || !process.env.SMTP_FROM) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendPasswordResetEmail = async ({ to, fullName, resetLink }) => {
  console.log('[MAIL] SMTP_ENV', getSmtpDiagnostics());

  const transporter = createTransporter();
  const info = await transporter.sendMail({
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
  const info = await transporter.sendMail({
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
};
