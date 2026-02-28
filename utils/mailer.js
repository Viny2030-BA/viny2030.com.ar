// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: `"VINY 2030" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  });
  return info;
}

module.exports = { sendEmail };
