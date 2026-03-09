# 🍷 Viny 2030 — Segunda Etapa: Instrucciones de integración

## Qué se agrega (sin tocar lo existente)

### Nuevos estados de la orden
```
pending → analizado → aceptado → pago2_recibido → informe2_enviado
```

### Nuevas columnas en la DB (se agregan automáticamente al arrancar)
| Columna           | Tipo        | Descripción                        |
|-------------------|-------------|------------------------------------|
| `comprobante2_at` | TIMESTAMPTZ | Timestamp del segundo comprobante  |
| `informe2_es`     | TEXT        | Segundo informe en español         |
| `informe2_trad`   | TEXT        | Segundo informe traducido          |

### Nuevos endpoints
| Método | Ruta                              | Descripción                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/api/upload/comprobante2`        | El cliente sube el 2do comprobante |
| POST   | `/api/orders/:code/informe2`      | Admin envía el 2do informe         |

---

## Instrucciones de integración paso a paso

### 1. `utils/migrate.js` — Reemplazar el archivo completo
Usar el archivo `migrate.js` de este paquete.
Las columnas nuevas se agregan con `ADD COLUMN IF NOT EXISTS` — seguro en producción.

### 2. `routes/upload.js` — Agregar al final

Agregar **antes** de `module.exports = router;`:

1. Al comienzo del archivo, agregar el import de pool (si no está):
```js
const pool = require('../utils/db');
```

2. Pegar el contenido de `upload_comprobante2_snippet.js`

### 3. `routes/orders.js` — Agregar al final

Pegar el contenido de `orders_informe2_snippet.js`
**antes** de `module.exports = router;`

### 4. `public/admin.html` — Agregar en el modal

**HTML:** Pegar el bloque HTML de `admin_segunda_etapa_snippet.html`
dentro del modal, justo **después** del div `.modal-actions` del primer informe.

**JS:** Pegar el bloque `<script>` de `admin_segunda_etapa_snippet.html`
dentro del `<script>` existente.

**Modificar `openExpediente()`:** En la línea que dice:
```js
document.getElementById('modalOverlay').classList.add('active');
```
Cambiar por:
```js
mostrarSegundaEtapa(order);
document.getElementById('modalOverlay').classList.add('active');
```

### 5. `test_viny2030.py` — Agregar al final

Pegar el contenido de `test_segunda_etapa_snippet.py`
al final del archivo de tests.

---

## Flujo completo de la segunda etapa

```
1. Cliente acepta primer análisis → status: 'aceptado'
   └─ Sistema envía email con CBU para pagar USD 40

2. Cliente transfiere y sube comprobante en /comprobante2?codigo=VNY-XXXX
   └─ POST /api/upload/comprobante2
   └─ status → 'pago2_recibido'
   └─ Admin recibe email con recordatorio de factura

3. Admin entra al panel /admin
   └─ Modal muestra la sección "Segunda Etapa" (visible solo si status es aceptado/pago2_recibido)
   └─ Admin hace clic en "Generar 2do informe con IA"
   └─ IA retoma contexto del primer análisis y genera informe de implementación
   └─ Admin puede editar en los textareas
   └─ Admin hace clic en "Enviar 2do informe al cliente"
   └─ POST /api/orders/:code/informe2
   └─ status → 'informe2_enviado'

4. Cliente recibe email con el segundo informe (sin botón de aceptar — es entrega final)
```

---

## Tests nuevos (4 tests)

```bash
pytest test_viny2030.py -v -k "TestSegundaEtapa"
```

Cubren:
- ✅ `comprobante2` sin archivo → 400
- ✅ `comprobante2` sin orderCode → 400
- ✅ `informe2` sin campos → 400
- ✅ `informe2` con orden inexistente → 404

---

## Página de comprobante 2

El cliente llega a `/comprobante?codigo=VNY-XXXX` (la misma página existente).
Para diferenciarlo, podés agregar en `comprobante.html` una variante que apunte a
`/api/upload/comprobante2` — o reutilizar la misma página con un parámetro `etapa=2`.

**Opción mínima** (sin tocar comprobante.html):
Agregar en el email de aceptación un link específico:
```
https://www.viny2030.com.ar/comprobante?codigo=VNY-XXXX&etapa=2
```
Y en `comprobante.html` detectar `etapa=2` para postear a `/api/upload/comprobante2`.
