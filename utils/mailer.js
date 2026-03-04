const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, attachments }) {
    const { data, error } = await resend.emails.send({
                  from: 'Viny 2030 <admin@viny2030.com.ar>',
          to,
          subject,
          html,
          attachments: attachments || []
    });

  if (error) throw new Error(error.message);
    return data;
}

module.exports = { sendEmail };
