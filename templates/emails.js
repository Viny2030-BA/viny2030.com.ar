const BANK_DATA = {
  cbu: process.env.CBU || '0000000000000000000000',
  alias: process.env.ALIAS || 'VINY.2030.PAGOS',
  titular: process.env.TITULAR || 'Viny 2030 S.A.',
  banco: process.env.BANCO || 'Banco Galicia'
};

const translations = {
  es: {
    subject: (code) => `✅ Orden ${code} – Datos de pago | Viny 2030`,
    greeting: (name) => `Hola ${name},`,
    intro: 'Gracias por tu pedido. A continuación encontrás los datos para realizar la transferencia bancaria:',
    paymentTitle: '💳 DATOS DE PAGO',
    labels: { bank: 'Banco', titular: 'Titular', cbu: 'CBU', alias: 'Alias', amount: 'Monto a transferir', code: 'Código de orden' },
    upload: 'Una vez realizado el pago, subí tu comprobante en:',
    uploadBtn: 'Subir comprobante',
    deadline: '⚠️ Tenés 48 horas para completar el pago.',
    footer: 'Si tenés alguna consulta, respondé este email.',
    thanks: '¡Gracias por confiar en Viny 2030!'
  },
  en: {
    subject: (code) => `✅ Order ${code} – Payment details | Viny 2030`,
    greeting: (name) => `Hello ${name},`,
    intro: 'Thank you for your order. Below you will find the bank transfer details:',
    paymentTitle: '💳 PAYMENT DETAILS',
    labels: { bank: 'Bank', titular: 'Account holder', cbu: 'CBU', alias: 'Alias', amount: 'Amount to transfer', code: 'Order code' },
    upload: 'Once payment is done, upload your receipt at:',
    uploadBtn: 'Upload receipt',
    deadline: '⚠️ You have 48 hours to complete the payment.',
    footer: 'If you have any questions, reply to this email.',
    thanks: 'Thank you for choosing Viny 2030!'
  },
  fr: {
    subject: (code) => `✅ Commande ${code} – Détails de paiement | Viny 2030`,
    greeting: (name) => `Bonjour ${name},`,
    intro: 'Merci pour votre commande. Voici les coordonnées bancaires pour effectuer le virement :',
    paymentTitle: '💳 DÉTAILS DE PAIEMENT',
    labels: { bank: 'Banque', titular: 'Titulaire', cbu: 'CBU', alias: 'Alias', amount: 'Montant à transférer', code: 'Code de commande' },
    upload: 'Une fois le paiement effectué, téléchargez votre reçu ici :',
    uploadBtn: 'Télécharger le reçu',
    deadline: '⚠️ Vous avez 48 heures pour finaliser le paiement.',
    footer: 'Pour toute question, répondez à cet email.',
    thanks: 'Merci de faire confiance à Viny 2030 !'
  },
  de: {
    subject: (code) => `✅ Bestellung ${code} – Zahlungsdaten | Viny 2030`,
    greeting: (name) => `Hallo ${name},`,
    intro: 'Vielen Dank für Ihre Bestellung. Hier sind die Bankdaten für die Überweisung:',
    paymentTitle: '💳 ZAHLUNGSDATEN',
    labels: { bank: 'Bank', titular: 'Kontoinhaber', cbu: 'CBU', alias: 'Alias', amount: 'Zu überweisender Betrag', code: 'Bestellcode' },
    upload: 'Nach der Zahlung laden Sie Ihren Beleg hier hoch:',
    uploadBtn: 'Beleg hochladen',
    deadline: '⚠️ Sie haben 48 Stunden, um die Zahlung abzuschließen.',
    footer: 'Bei Fragen antworten Sie auf diese E-Mail.',
    thanks: 'Vielen Dank, dass Sie Viny 2030 gewählt haben!'
  },
  it: {
    subject: (code) => `✅ Ordine ${code} – Dati di pagamento | Viny 2030`,
    greeting: (name) => `Ciao ${name},`,
    intro: 'Grazie per il tuo ordine. Di seguito trovi i dati bancari per effettuare il bonifico:',
    paymentTitle: '💳 DATI DI PAGAMENTO',
    labels: { bank: 'Banca', titular: 'Intestatario', cbu: 'CBU', alias: 'Alias', amount: 'Importo da trasferire', code: 'Codice ordine' },
    upload: 'Una volta effettuato il pagamento, carica la ricevuta qui:',
    uploadBtn: 'Carica ricevuta',
    deadline: '⚠️ Hai 48 ore per completare il pagamento.',
    footer: 'Per qualsiasi domanda, rispondi a questa email.',
    thanks: 'Grazie per aver scelto Viny 2030!'
  }
};

function generatePaymentEmail({ name, email, amount, orderCode, lang = 'es', uploadUrl }) {
  const t = translations[lang] || translations.es;
  const l = t.labels;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; font-family: 'Georgia', serif; color: #e8e0d0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 40px 0 30px; border-bottom: 1px solid #2a2a2a; }
    .logo { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #c9a84c; text-transform: uppercase; }
    .logo-sub { font-size: 11px; letter-spacing: 4px; color: #666; margin-top: 4px; text-transform: uppercase; }
    .greeting { padding: 32px 0 16px; font-size: 18px; color: #e8e0d0; }
    .intro { font-size: 15px; color: #aaa; line-height: 1.6; padding-bottom: 28px; }
    .payment-card { background: #111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px; margin: 8px 0 28px; }
    .payment-title { font-size: 12px; letter-spacing: 4px; color: #c9a84c; text-transform: uppercase; margin-bottom: 20px; }
    .payment-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #1e1e1e; }
    .payment-row:last-child { border-bottom: none; }
    .payment-label { font-size: 11px; letter-spacing: 2px; color: #666; text-transform: uppercase; }
    .payment-value { font-size: 15px; color: #e8e0d0; font-weight: 600; }
    .payment-value.highlight { color: #c9a84c; font-size: 18px; }
    .code-box { background: #1a1a1a; border: 1px dashed #c9a84c; border-radius: 8px; padding: 16px; text-align: center; margin: 8px 0 28px; }
    .code-label { font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .code-value { font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #c9a84c; font-family: monospace; }
    .upload-section { background: #0d1a0d; border: 1px solid #1a3a1a; border-radius: 12px; padding: 24px; margin: 8px 0 28px; text-align: center; }
    .upload-text { font-size: 14px; color: #aaa; margin-bottom: 16px; }
    .upload-btn { display: inline-block; background: #c9a84c; color: #0a0a0a; text-decoration: none; font-weight: 900; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; padding: 14px 32px; border-radius: 6px; }
    .deadline { background: #1a0d00; border-left: 3px solid #c9a84c; padding: 12px 16px; font-size: 13px; color: #c9a84c; margin: 0 0 28px; border-radius: 0 6px 6px 0; }
    .footer { border-top: 1px solid #1e1e1e; padding-top: 24px; text-align: center; }
    .footer-text { font-size: 13px; color: #555; line-height: 1.8; }
    .footer-thanks { font-size: 16px; color: #c9a84c; margin-top: 12px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">VINY 2030</div>
      <div class="logo-sub">Argentina · Premium</div>
    </div>

    <div class="greeting">${t.greeting(name)}</div>
    <div class="intro">${t.intro}</div>

    <div class="code-box">
      <div class="code-label">${l.code}</div>
      <div class="code-value">${orderCode}</div>
    </div>

    <div class="payment-card">
      <div class="payment-title">${t.paymentTitle}</div>
      <div class="payment-row">
        <span class="payment-label">${l.bank}</span>
        <span class="payment-value">${BANK_DATA.banco}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">${l.titular}</span>
        <span class="payment-value">${BANK_DATA.titular}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">${l.cbu}</span>
        <span class="payment-value">${BANK_DATA.cbu}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">${l.alias}</span>
        <span class="payment-value">${BANK_DATA.alias}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">${l.amount}</span>
        <span class="payment-value highlight">$${Number(amount).toLocaleString('es-AR')}</span>
      </div>
    </div>

    <div class="upload-section">
      <div class="upload-text">${t.upload}</div>
      <a href="${uploadUrl}" class="upload-btn">${t.uploadBtn}</a>
    </div>

    <div class="deadline">${t.deadline}</div>

    <div class="footer">
      <div class="footer-text">${t.footer}</div>
      <div class="footer-thanks">${t.thanks}</div>
    </div>
  </div>
</body>
</html>`;

  return { subject: t.subject(orderCode), html };
}

module.exports = { generatePaymentEmail };
