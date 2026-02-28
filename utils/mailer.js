const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendEmail({ to, subject, html, attachments }) {
  const info = await transporter.sendMail({
    from: `"Viny 2030" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: attachments || []
  });
  return info;
}

module.exports = { sendEmail };
