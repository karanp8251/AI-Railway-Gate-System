const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!env.email.user || !env.email.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: false,
      auth: { user: env.email.user, pass: env.email.pass },
    });
  }
  return transporter;
}

async function sendAlertEmail(subject, html) {
  const transport = getTransporter();
  if (!transport || !env.email.alertTo) {
    console.log('[Email] Skipped (not configured):', subject);
    return false;
  }
  try {
    await transport.sendMail({
      from: `"Railway Gate System" <${env.email.user}>`,
      to: env.email.alertTo,
      subject: `[ALERT] ${subject}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return false;
  }
}

module.exports = { sendAlertEmail };
