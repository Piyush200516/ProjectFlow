const serverless = require('serverless-http');
const app = require('../../src/app');
const { verifySmtpTransporter } = require('../../src/utils/emailService');

let smtpVerifyStarted = false;

const runSmtpStartupCheck = () => {
  if (smtpVerifyStarted) {
    return;
  }

  smtpVerifyStarted = true;
  verifySmtpTransporter().catch((error) => {
    console.error('[MAIL] startup SMTP check failed unexpectedly', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });
  });
};

runSmtpStartupCheck();

module.exports.handler = serverless(app);
