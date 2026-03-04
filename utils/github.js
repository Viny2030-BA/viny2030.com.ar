const https = require('https');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG || 'Viny2030-Clientes';

function githubRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Viny2030-App',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createClientRepo(orderCode) {
  const repoName = orderCode.toLowerCase();

  // Crear repositorio privado en la org
  const res = await githubRequest('POST', `/orgs/${GITHUB_ORG}/repos`, {
    name: repoName,
    description: `Expediente cliente — ${orderCode}`,
    private: true,
    auto_init: true
  });

  if (res.status !== 201) {
    throw new Error(`Error creando repo: ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

async function uploadFileToRepo(repoName, filePath, content, message) {
  const encoded = Buffer.from(content).toString('base64');

  const res = await githubRequest('PUT', `/repos/${GITHUB_ORG}/${repoName}/contents/${filePath}`, {
    message,
    content: encoded
  });

  return res;
}

async function uploadBinaryFileToRepo(repoName, filePath, localPath, message) {
  const fileBuffer = fs.readFileSync(localPath);
  const encoded = fileBuffer.toString('base64');

  const res = await githubRequest('PUT', `/repos/${GITHUB_ORG}/${repoName}/contents/${filePath}`, {
    message,
    content: encoded
  });

  return res;
}

async function setupClientRepo({ orderCode, nombre, email, monto, producto, comprobantePath, comprobanteOriginalName }) {
  const repoName = orderCode.toLowerCase();

  // 1. Crear repo
  await createClientRepo(orderCode);

  // Esperar un momento para que GitHub inicialice el repo
  await new Promise(r => setTimeout(r, 2000));

  // 2. orden.json
  const ordenData = JSON.stringify({
    codigo: orderCode,
    nombre,
    email,
    monto,
    producto,
    fecha_orden: new Date().toISOString(),
    estado: 'pendiente'
  }, null, 2);
  await uploadFileToRepo(repoName, 'orden.json', ordenData, '📋 Datos de la orden');

  // 3. estado.md
  const estadoMd = `# Estado del Expediente — ${orderCode}

| Campo | Valor |
|-------|-------|
| **Código** | ${orderCode} |
| **Cliente** | ${nombre} |
| **Email** | ${email} |
| **Monto** | ${monto} |
| **Producto** | ${producto} |

## Historial de estados

| Fecha | Estado | Nota |
|-------|--------|------|
| ${new Date().toLocaleString('es-AR')} | 🟡 Pendiente | Comprobante recibido |
`;
  await uploadFileToRepo(repoName, 'estado.md', estadoMd, '📊 Estado inicial');

  // 4. emails.log
  const emailsLog = `# Historial de Emails — ${orderCode}

| Fecha | Destinatario | Asunto |
|-------|-------------|--------|
| ${new Date().toLocaleString('es-AR')} | ${email} | Opciones de pago enviadas |
`;
  await uploadFileToRepo(repoName, 'emails.log', emailsLog, '📧 Log de emails inicial');

  // 5. analisis.md (vacío, se completa después)
  const analisisMd = `# Análisis — ${orderCode}

> Este archivo se completará después de la primera devolución del análisis.

## Descripción del problema

_Pendiente_

## Análisis técnico

_Pendiente_

## Resolución propuesta

_Pendiente_
`;
  await uploadFileToRepo(repoName, 'analisis.md', analisisMd, '🔬 Plantilla de análisis');

  // 6. Subir comprobante
  if (comprobantePath && fs.existsSync(comprobantePath)) {
    await uploadBinaryFileToRepo(
      repoName,
      `comprobantes/${comprobanteOriginalName}`,
      comprobantePath,
      '💰 Comprobante de pago'
    );
  }

  return `https://github.com/${GITHUB_ORG}/${repoName}`;
}

module.exports = { setupClientRepo, uploadFileToRepo, uploadBinaryFileToRepo };
