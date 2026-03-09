// utils/github.js
// Maneja toda la interacción con la GitHub API para repos de clientes
// Org: Viny2030-Clientes | Repos privados por cliente

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ORG = process.env.GITHUB_ORG || 'Viny2030-Clientes';

// ─────────────────────────────────────────────
// Crear repo privado para un cliente
// repoName: 'vny-2026-0009'
// ─────────────────────────────────────────────
async function createClientRepo(repoName, clientName = '') {
  try {
    const { data } = await octokit.repos.createInOrg({
      org: ORG,
      name: repoName,
      private: true,
      auto_init: true,
      description: `Algoritmo y datos - ${clientName || repoName}`,
    });
    return { ok: true, url: data.html_url, full_name: data.full_name };
  } catch (err) {
    // Si ya existe (422), devolvemos ok igual
    if (err.status === 422) {
      return {
        ok: true,
        url: `https://github.com/${ORG}/${repoName}`,
        full_name: `${ORG}/${repoName}`,
        already_existed: true,
      };
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// Subir (o actualizar) un archivo al repo
// path: 'documentos/facturas/factura_01.pdf'
// content: Buffer o string (se convierte a base64)
// ─────────────────────────────────────────────
async function uploadFileToRepo(repoName, filePath, content, commitMsg = null) {
  const message = commitMsg || `chore: add ${filePath}`;
  const contentB64 =
    typeof content === 'string'
      ? Buffer.from(content).toString('base64')
      : content.toString('base64');

  // Obtener SHA si el archivo ya existe (para actualizar)
  let sha;
  try {
    const { data } = await octokit.repos.getContent({
      owner: ORG,
      repo: repoName,
      path: filePath,
    });
    sha = data.sha;
  } catch {
    // Archivo nuevo → sin SHA
  }

  const payload = {
    owner: ORG,
    repo: repoName,
    path: filePath,
    message,
    content: contentB64,
  };
  if (sha) payload.sha = sha;

  const { data } = await octokit.repos.createOrUpdateFileContents(payload);
  return { ok: true, commit: data.commit.sha, url: data.content.html_url };
}

// ─────────────────────────────────────────────
// Inicializar estructura completa del repo
// Crea carpetas con .gitkeep + README + requirements.txt base
// ─────────────────────────────────────────────
async function initRepoStructure(repoName, clientInfo = {}) {
  const { code = repoName, name = '', email = '' } = clientInfo;

  const README = `# ${code}

**Cliente:** ${name}  
**Código:** ${code}  
**Generado:** ${new Date().toISOString().split('T')[0]}

## Estructura

\`\`\`
├── app.py                  ← Dashboard Streamlit (se sube al finalizar el análisis)
├── requirements.txt
├── datos/                  ← Datasets del cliente
└── documentos/
    ├── facturas/
    └── recibos/
\`\`\`
`;

  const REQUIREMENTS = `streamlit>=1.32.0
pandas>=2.0.0
plotly>=5.18.0
openpyxl>=3.1.0
requests>=2.31.0
`;

  const files = [
    { path: 'README.md',                      content: README,       msg: 'docs: init README' },
    { path: 'requirements.txt',               content: REQUIREMENTS, msg: 'chore: add requirements' },
    { path: 'datos/.gitkeep',                 content: '',           msg: 'chore: init datos/' },
    { path: 'documentos/facturas/.gitkeep',   content: '',           msg: 'chore: init facturas/' },
    { path: 'documentos/recibos/.gitkeep',    content: '',           msg: 'chore: init recibos/' },
  ];

  const results = [];
  for (const f of files) {
    const r = await uploadFileToRepo(repoName, f.path, f.content, f.msg);
    results.push({ path: f.path, ...r });
  }
  return results;
}

// ─────────────────────────────────────────────
// Subir comprobante de pago al repo
// tipo: 'facturas' | 'recibos' | 'datos'
// ─────────────────────────────────────────────
async function uploadDocumentToRepo(repoName, tipo, filename, buffer) {
  const carpeta =
    tipo === 'datos'
      ? 'datos'
      : `documentos/${tipo}`;

  const filePath = `${carpeta}/${filename}`;
  const msg = `docs: upload ${tipo}/${filename}`;
  return uploadFileToRepo(repoName, filePath, buffer, msg);
}

// ─────────────────────────────────────────────
// Push del app.py final (cuando el algoritmo está listo)
// ─────────────────────────────────────────────
async function pushAppPy(repoName, appPyContent) {
  return uploadFileToRepo(
    repoName,
    'app.py',
    appPyContent,
    'feat: deploy Streamlit dashboard'
  );
}

module.exports = {
  createClientRepo,
  uploadFileToRepo,
  initRepoStructure,
  uploadDocumentToRepo,
  pushAppPy,
};
