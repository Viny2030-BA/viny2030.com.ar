// utils/appGenerator.js
// Genera el app.py de Streamlit usando Claude API
// a partir de los datos del cliente (CSV/Excel) y su relato

require('dotenv').config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Genera el app.py completo de Streamlit para un cliente
 * @param {Object} params
 * @param {string} params.orderCode     - Ej: "VNY-2026-0010"
 * @param {string} params.clientName    - Nombre del cliente
 * @param {string} params.relato        - Descripción del problema
 * @param {string} params.csvContent    - Contenido del CSV como string
 * @param {string} params.adminComment  - Comentario adicional del admin (opcional)
 * @returns {Promise<{ok: boolean, appPy: string, error?: string}>}
 */
async function generateAppPy({ orderCode, clientName, relato, csvContent, adminComment = '' }) {
  if (!ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY no configurada' };
  }

  const prompt = `Sos un experto en Python, Streamlit, Pandas y Plotly.
Tu tarea es generar un archivo app.py COMPLETO y FUNCIONAL para un dashboard Streamlit personalizado.

## DATOS DEL CLIENTE
- Código: ${orderCode}
- Nombre: ${clientName}
- Relato del problema: ${relato || 'No especificado'}
${adminComment ? `- Nota del admin: ${adminComment}` : ''}

## DATASET DEL CLIENTE (CSV)
\`\`\`
${csvContent}
\`\`\`

## INSTRUCCIONES PARA GENERAR EL app.py

1. **Analizá las columnas del CSV** y determiná qué tipo de análisis tiene sentido (inventario, ventas, finanzas, producción, etc.)

2. **Embebé los datos directamente** en el código como CSV_DATA = """...""" (como en el ejemplo)

3. **Generá visualizaciones inteligentes** con Plotly adaptadas al tipo de datos:
   - Si hay fechas → gráfico de línea temporal
   - Si hay categorías → gráfico de barras o pie
   - Si hay valores numéricos → scatter, histograma o heatmap
   - Si hay stocks/inventarios → alertas de reposición
   - Siempre incluir KPIs relevantes en métricas

4. **Estructura obligatoria del app.py:**
   - Configuración de página con st.set_page_config
   - CSS personalizado con colores oscuros (fondo #0d1f35, dorado #c9a84c, rojo #e94560)
   - Sidebar con filtros relevantes
   - Header con título y código de orden
   - KPIs en columnas (st.metric)
   - Tabs con: Dashboard principal, Alertas/Anomalías, Análisis detallado, Tabla completa
   - Footer con "🍷 Viny 2030 — viny2030.com.ar — ${orderCode}"

5. **Calidad del algoritmo:**
   - Calculá métricas útiles para el negocio del cliente
   - Detectá anomalías o alertas automáticamente
   - Agregá lógica de negocio inteligente basada en el relato

6. **Requisitos técnicos:**
   - Solo usar: streamlit, pandas, plotly (no otras librerías)
   - @st.cache_data en la función de carga de datos
   - Manejo de errores robusto
   - Código limpio y comentado en español

Respondé ÚNICAMENTE con el código Python completo, sin explicaciones, sin bloques markdown, sin texto antes o después. Solo el código Python puro que empieza con el docstring o import.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { ok: false, error: `Error Anthropic API: ${response.status} - ${err}` };
    }

    const data = await response.json();
    const appPy = data.content?.[0]?.text || '';

    if (!appPy || appPy.length < 100) {
      return { ok: false, error: 'La IA no generó código válido' };
    }

    return { ok: true, appPy };

  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { generateAppPy };
