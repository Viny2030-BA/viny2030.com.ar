// utils/emailTemplates.js — Plantillas en 5 idiomas con datos de pago completos

function getEmailTemplate(lang, data) {
  const {
    nombre, monto, orderCode,
    cbu, alias, titular, banco,
    cbuDolares, aliasDolares,
    swift, bancoInternacional, cuentaInternacional, direccionBeneficiario,
    uploadUrl
  } = data;

  // Bloque de datos bancarios completo (pesos + dólares + internacional)
  const bankBlockES = `
    <div style="background:#f0f4ff;border-left:4px solid #e94560;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">💳 Transferencia en PESOS (ARS)</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">Banco:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${banco}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Titular:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">CBU:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;font-size:14px;letter-spacing:1px;">${cbu}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Alias:</td><td style="padding:6px 0;font-weight:bold;color:#e94560;font-size:18px;">${alias}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Monto:</td><td style="padding:6px 0;font-weight:bold;color:#333;font-size:20px;">USD ${monto}</td></tr>
      </table>
    </div>
    <div style="background:#f0fff4;border-left:4px solid #22c55e;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">💵 Transferencia en DÓLARES (USD)</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">Banco:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${banco}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Titular:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">CBU:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;font-size:14px;letter-spacing:1px;">${cbuDolares}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Alias:</td><td style="padding:6px 0;font-weight:bold;color:#22c55e;font-size:18px;">${aliasDolares}</td></tr>
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">🌍 Transferencia Internacional (SWIFT)</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">SWIFT:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;letter-spacing:2px;">${swift}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Banco:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${bancoInternacional}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Cuenta:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${cuentaInternacional}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Titular:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Dirección:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${direccionBeneficiario}</td></tr>
      </table>
    </div>`;

  const bankBlockEN = `
    <div style="background:#f0f4ff;border-left:4px solid #e94560;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">💳 Transfer in PESOS (ARS)</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">Bank:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${banco}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Account holder:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">CBU:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;font-size:14px;letter-spacing:1px;">${cbu}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Alias:</td><td style="padding:6px 0;font-weight:bold;color:#e94560;font-size:18px;">${alias}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Amount:</td><td style="padding:6px 0;font-weight:bold;color:#333;font-size:20px;">USD ${monto}</td></tr>
      </table>
    </div>
    <div style="background:#f0fff4;border-left:4px solid #22c55e;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">💵 Transfer in USD</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">Bank:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${banco}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Account holder:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">CBU:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;font-size:14px;letter-spacing:1px;">${cbuDolares}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Alias:</td><td style="padding:6px 0;font-weight:bold;color:#22c55e;font-size:18px;">${aliasDolares}</td></tr>
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:20px;border-radius:5px;margin:20px 0;">
      <h3 style="margin:0 0 15px;color:#1a1a2e;">🌍 International Wire Transfer (SWIFT)</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">SWIFT:</td><td style="padding:6px 0;font-weight:bold;color:#1a1a2e;letter-spacing:2px;">${swift}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Bank:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${bancoInternacional}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Account:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${cuentaInternacional}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Beneficiary:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${titular}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Address:</td><td style="padding:6px 0;font-weight:bold;color:#333;">${direccionBeneficiario}</td></tr>
      </table>
    </div>`;

  const codeBadge = (txt) => `
    <div style="background:rgba(233,69,96,0.1);border:1px solid #e94560;border-radius:8px;padding:12px 18px;text-align:center;margin:20px 0;">
      <p style="margin:0;color:#e94560;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${txt}</p>
      <p style="margin:6px 0 0;color:#e94560;font-size:22px;font-weight:bold;letter-spacing:3px;">${orderCode}</p>
    </div>`;

  const uploadBtn = (txt) => `
    <div style="text-align:center;margin:25px 0;">
      <a href="${uploadUrl}" style="background:#e94560;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
        📤 ${txt}
      </a>
    </div>`;

  const footer = (txt) => `<p style="color:#999;font-size:12px;text-align:center;margin-top:30px;">${txt}</p>`;

  const wrap = (body) => `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f9f9f9;padding:20px;">
      <div style="background:#1a1a2e;padding:30px;border-radius:10px 10px 0 0;text-align:center;">
        <h1 style="color:#e94560;margin:0;font-size:28px;">VINY 2030</h1>
        <p style="color:#aaa;margin:5px 0 0;font-size:13px;letter-spacing:2px;">DIAGNÓSTICO ALGORÍTMICO</p>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 10px 10px;">${body}</div>
    </div>`;

  const templates = {
    es: {
      subject: `✅ Datos de pago — Pedido ${orderCode}`,
      html: wrap(`
        <p style="font-size:16px;color:#333;">Hola <strong>${nombre}</strong>,</p>
        <p style="color:#555;margin:10px 0 20px;">Gracias por tu pedido. A continuación encontrás <strong>todas las opciones de pago</strong>:</p>
        ${bankBlockES}
        ${codeBadge('Tu código de pedido')}
        <p style="color:#666;font-size:13px;text-align:center;">Guardá este código — lo necesitás para subir el comprobante.</p>
        ${uploadBtn('Subir comprobante de pago')}
        ${footer('viny2030.com.ar · Ante cualquier consulta respondé este email.')}
      `)
    },
    en: {
      subject: `✅ Payment details — Order ${orderCode}`,
      html: wrap(`
        <p style="font-size:16px;color:#333;">Hello <strong>${nombre}</strong>,</p>
        <p style="color:#555;margin:10px 0 20px;">Thank you for your order. Here are <strong>all payment options</strong>:</p>
        ${bankBlockEN}
        ${codeBadge('Your order code')}
        <p style="color:#666;font-size:13px;text-align:center;">Save this code — you'll need it to upload your receipt.</p>
        ${uploadBtn('Upload payment receipt')}
        ${footer('viny2030.com.ar · For any questions, reply to this email.')}
      `)
    },
    fr: {
      subject: `✅ Détails de paiement — Commande ${orderCode}`,
      html: wrap(`
        <p style="font-size:16px;color:#333;">Bonjour <strong>${nombre}</strong>,</p>
        <p style="color:#555;margin:10px 0 20px;">Merci pour votre commande. Voici <strong>toutes les options de paiement</strong> :</p>
        ${bankBlockES.replace('PESOS (ARS)','PESOS (ARS)').replace('Banco:','Banque :').replace('Titular:','Titulaire :').replace('Monto:','Montant :')}
        ${codeBadge('Votre code de commande')}
        <p style="color:#666;font-size:13px;text-align:center;">Conservez ce code — vous en aurez besoin pour envoyer le justificatif.</p>
        ${uploadBtn('Envoyer le justificatif')}
        ${footer('viny2030.com.ar · Pour toute question, répondez à cet email.')}
      `)
    },
    de: {
      subject: `✅ Zahlungsdaten — Bestellung ${orderCode}`,
      html: wrap(`
        <p style="font-size:16px;color:#333;">Hallo <strong>${nombre}</strong>,</p>
        <p style="color:#555;margin:10px 0 20px;">Vielen Dank für Ihre Bestellung. Hier sind <strong>alle Zahlungsoptionen</strong>:</p>
        ${bankBlockES.replace('Titular:','Inhaber :').replace('Monto:','Betrag :')}
        ${codeBadge('Ihr Bestellcode')}
        <p style="color:#666;font-size:13px;text-align:center;">Bewahren Sie diesen Code auf — Sie benötigen ihn für den Zahlungsbeleg.</p>
        ${uploadBtn('Zahlungsbeleg hochladen')}
        ${footer('viny2030.com.ar · Bei Fragen antworten Sie auf diese E-Mail.')}
      `)
    },
    it: {
      subject: `✅ Dati di pagamento — Ordine ${orderCode}`,
      html: wrap(`
        <p style="font-size:16px;color:#333;">Ciao <strong>${nombre}</strong>,</p>
        <p style="color:#555;margin:10px 0 20px;">Grazie per il tuo ordine. Di seguito trovi <strong>tutte le opzioni di pagamento</strong>:</p>
        ${bankBlockES.replace('Titular:','Intestatario :').replace('Monto:','Importo :')}
        ${codeBadge('Il tuo codice ordine')}
        <p style="color:#666;font-size:13px;text-align:center;">Salva questo codice — ti servirà per caricare la ricevuta.</p>
        ${uploadBtn('Carica la ricevuta di pagamento')}
        ${footer('viny2030.com.ar · Per qualsiasi domanda, rispondi a questa email.')}
      `)
    }
  };

  return templates[lang] || templates['es'];
}

module.exports = { getEmailTemplate };