// utils/emailTemplates.js
// Plantillas de email en 5 idiomas

function getEmailTemplate(lang, data) {
  const { nombre, monto, orderCode, cbu, alias, titular, banco, uploadUrl } = data;

  const templates = {
    es: {
      subject: `✅ Datos de pago - Pedido ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 28px;">VINY 2030</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Confirmación de pedido</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${nombre}</strong>,</p>
            <p style="color: #555;">Gracias por tu pedido. A continuación encontrás los datos para realizar el pago:</p>
            
            <div style="background: #f0f4ff; border-left: 4px solid #e94560; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a1a2e;">💳 Datos bancarios</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Banco:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${banco}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Titular:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${titular}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">CBU:</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e; font-size: 14px; letter-spacing: 1px;">${cbu}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Alias:</td><td style="padding: 6px 0; font-weight: bold; color: #e94560; font-size: 18px;">${alias}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Monto:</td><td style="padding: 6px 0; font-weight: bold; color: #333; font-size: 20px;">$${monto}</td></tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📋 Tu código de pedido: ${orderCode}</strong></p>
              <p style="margin: 5px 0 0; color: #856404; font-size: 13px;">Guardá este código — lo necesitás para subir el comprobante.</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${uploadUrl}" style="background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                📤 Subir comprobante de pago
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              viny2030.com.ar · Ante cualquier consulta respondé este email.
            </p>
          </div>
        </div>`
    },

    en: {
      subject: `✅ Payment details - Order ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 28px;">VINY 2030</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Order Confirmation</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${nombre}</strong>,</p>
            <p style="color: #555;">Thank you for your order. Please find below the bank transfer details:</p>

            <div style="background: #f0f4ff; border-left: 4px solid #e94560; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a1a2e;">💳 Bank details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Bank:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${banco}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Account holder:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${titular}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">CBU:</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e; font-size: 14px; letter-spacing: 1px;">${cbu}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Alias:</td><td style="padding: 6px 0; font-weight: bold; color: #e94560; font-size: 18px;">${alias}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Amount:</td><td style="padding: 6px 0; font-weight: bold; color: #333; font-size: 20px;">$${monto}</td></tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📋 Your order code: ${orderCode}</strong></p>
              <p style="margin: 5px 0 0; color: #856404; font-size: 13px;">Save this code — you'll need it to upload your payment receipt.</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${uploadUrl}" style="background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                📤 Upload payment receipt
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              viny2030.com.ar · For any questions, reply to this email.
            </p>
          </div>
        </div>`
    },

    fr: {
      subject: `✅ Détails de paiement - Commande ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 28px;">VINY 2030</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Confirmation de commande</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Bonjour <strong>${nombre}</strong>,</p>
            <p style="color: #555;">Merci pour votre commande. Voici les coordonnées bancaires pour effectuer le paiement :</p>

            <div style="background: #f0f4ff; border-left: 4px solid #e94560; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a1a2e;">💳 Coordonnées bancaires</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Banque :</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${banco}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Titulaire :</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${titular}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">CBU :</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e; font-size: 14px; letter-spacing: 1px;">${cbu}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Alias :</td><td style="padding: 6px 0; font-weight: bold; color: #e94560; font-size: 18px;">${alias}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Montant :</td><td style="padding: 6px 0; font-weight: bold; color: #333; font-size: 20px;">$${monto}</td></tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📋 Votre code de commande : ${orderCode}</strong></p>
              <p style="margin: 5px 0 0; color: #856404; font-size: 13px;">Conservez ce code — vous en aurez besoin pour télécharger votre reçu.</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${uploadUrl}" style="background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                📤 Envoyer le justificatif de paiement
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              viny2030.com.ar · Pour toute question, répondez à cet email.
            </p>
          </div>
        </div>`
    },

    de: {
      subject: `✅ Zahlungsdaten - Bestellung ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 28px;">VINY 2030</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Bestellbestätigung</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hallo <strong>${nombre}</strong>,</p>
            <p style="color: #555;">Vielen Dank für Ihre Bestellung. Hier sind die Bankdaten für die Zahlung:</p>

            <div style="background: #f0f4ff; border-left: 4px solid #e94560; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a1a2e;">💳 Bankdaten</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Bank:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${banco}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Kontoinhaber:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${titular}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">CBU:</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e; font-size: 14px; letter-spacing: 1px;">${cbu}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Alias:</td><td style="padding: 6px 0; font-weight: bold; color: #e94560; font-size: 18px;">${alias}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Betrag:</td><td style="padding: 6px 0; font-weight: bold; color: #333; font-size: 20px;">$${monto}</td></tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📋 Ihr Bestellcode: ${orderCode}</strong></p>
              <p style="margin: 5px 0 0; color: #856404; font-size: 13px;">Bewahren Sie diesen Code auf — Sie benötigen ihn zum Hochladen des Zahlungsbelegs.</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${uploadUrl}" style="background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                📤 Zahlungsbeleg hochladen
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              viny2030.com.ar · Bei Fragen antworten Sie auf diese E-Mail.
            </p>
          </div>
        </div>`
    },

    it: {
      subject: `✅ Dati di pagamento - Ordine ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 28px;">VINY 2030</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Conferma ordine</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Ciao <strong>${nombre}</strong>,</p>
            <p style="color: #555;">Grazie per il tuo ordine. Di seguito trovi i dati bancari per effettuare il pagamento:</p>

            <div style="background: #f0f4ff; border-left: 4px solid #e94560; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a1a2e;">💳 Dati bancari</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Banca:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${banco}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Intestatario:</td><td style="padding: 6px 0; font-weight: bold; color: #333;">${titular}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">CBU:</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e; font-size: 14px; letter-spacing: 1px;">${cbu}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Alias:</td><td style="padding: 6px 0; font-weight: bold; color: #e94560; font-size: 18px;">${alias}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Importo:</td><td style="padding: 6px 0; font-weight: bold; color: #333; font-size: 20px;">$${monto}</td></tr>
              </table>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📋 Il tuo codice ordine: ${orderCode}</strong></p>
              <p style="margin: 5px 0 0; color: #856404; font-size: 13px;">Salva questo codice — ti servirà per caricare la ricevuta di pagamento.</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${uploadUrl}" style="background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                📤 Carica la ricevuta di pagamento
              </a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              viny2030.com.ar · Per qualsiasi domanda, rispondi a questa email.
            </p>
          </div>
        </div>`
    }
  };

  return templates[lang] || templates['es'];
}

module.exports = { getEmailTemplate };
