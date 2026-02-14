# 🔌 ENDPOINT PARA LISTAR ARCHIVOS

## ⚠️ IMPORTANTE
Para que la sección "📁 Archivos Subidos" funcione, necesitas agregar este endpoint en tu backend:

**Endpoint:** `GET /api/listar-archivos`
**Header requerido:** `X-API-Key: <api_key_del_usuario>`

---

## 📦 Respuesta esperada (JSON):

```json
{
  "archivos": [
    {
      "nombre": "factura_enero.pdf",
      "categoria": "activos_corrientes",
      "fecha": "2026-02-14T10:30:00Z"
    },
    {
      "nombre": "balance.xlsx",
      "categoria": "patrimonio_neto",
      "fecha": "2026-02-14T11:45:00Z"
    }
  ]
}
```

**Si no hay archivos:**
```json
{
  "archivos": []
}
```

---

## 💻 EJEMPLOS DE IMPLEMENTACIÓN

### **Opción 1: Python + Flask**

```python
from flask import Flask, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/api/listar-archivos', methods=['GET'])
def listar_archivos():
    # Obtener API key del header
    api_key = request.headers.get('X-API-Key')
    
    if not api_key:
        return jsonify({'error': 'API Key requerida'}), 401
    
    # Buscar empresa en la base de datos
    empresa = buscar_empresa_por_api_key(api_key)
    
    if not empresa:
        return jsonify({'error': 'API Key inválida'}), 401
    
    # Aquí debes buscar los archivos según tu lógica
    # Puede ser desde:
    # - Base de datos (si guardas metadata de archivos)
    # - GitHub API (si consultas el repo directamente)
    # - Sistema de archivos local
    
    # EJEMPLO: Desde base de datos
    archivos = obtener_archivos_de_bd(empresa['id'])
    
    # Formatear respuesta
    archivos_formateados = []
    for archivo in archivos:
        archivos_formateados.append({
            'nombre': archivo['nombre'],
            'categoria': archivo['categoria'],
            'fecha': archivo['fecha_subida'].isoformat()
        })
    
    return jsonify({
        'archivos': archivos_formateados
    })

# Funciones auxiliares (implementar según tu DB)
def buscar_empresa_por_api_key(api_key):
    # Consulta a tu base de datos
    # SELECT * FROM empresas WHERE api_key = api_key
    pass

def obtener_archivos_de_bd(empresa_id):
    # Consulta a tu base de datos
    # SELECT * FROM archivos WHERE empresa_id = empresa_id ORDER BY fecha_subida DESC
    pass
```

---

### **Opción 2: Python + FastAPI**

```python
from fastapi import FastAPI, Header, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class ArchivoResponse(BaseModel):
    nombre: str
    categoria: str
    fecha: datetime

class ListaArchivosResponse(BaseModel):
    archivos: List[ArchivoResponse]

@app.get('/api/listar-archivos', response_model=ListaArchivosResponse)
async def listar_archivos(x_api_key: Optional[str] = Header(None)):
    # Validar API Key
    if not x_api_key:
        raise HTTPException(status_code=401, detail='API Key requerida')
    
    # Buscar empresa
    empresa = await buscar_empresa_por_api_key(x_api_key)
    
    if not empresa:
        raise HTTPException(status_code=401, detail='API Key inválida')
    
    # Obtener archivos
    archivos = await obtener_archivos_de_bd(empresa['id'])
    
    return ListaArchivosResponse(archivos=archivos)

# Funciones auxiliares
async def buscar_empresa_por_api_key(api_key: str):
    # Implementar consulta a base de datos
    pass

async def obtener_archivos_de_bd(empresa_id: int):
    # Implementar consulta a base de datos
    pass
```

---

### **Opción 3: Node.js + Express**

```javascript
const express = require('express');
const app = express();

app.get('/api/listar-archivos', async (req, res) => {
    // Obtener API key del header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API Key requerida' });
    }
    
    try {
        // Buscar empresa en la base de datos
        const empresa = await buscarEmpresaPorApiKey(apiKey);
        
        if (!empresa) {
            return res.status(401).json({ error: 'API Key inválida' });
        }
        
        // Obtener archivos
        const archivos = await obtenerArchivosDeDB(empresa.id);
        
        // Formatear respuesta
        const archivosFormateados = archivos.map(archivo => ({
            nombre: archivo.nombre,
            categoria: archivo.categoria,
            fecha: archivo.fecha_subida.toISOString()
        }));
        
        res.json({
            archivos: archivosFormateados
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Funciones auxiliares
async function buscarEmpresaPorApiKey(apiKey) {
    // Consulta a tu base de datos
    // SELECT * FROM empresas WHERE api_key = ?
}

async function obtenerArchivosDeDB(empresaId) {
    // Consulta a tu base de datos
    // SELECT * FROM archivos WHERE empresa_id = ? ORDER BY fecha_subida DESC
}
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS SUGERIDA

Si aún no tienes una tabla de archivos, te recomiendo esta estructura:

```sql
CREATE TABLE archivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    ruta_github VARCHAR(500),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);
```

**Categorías válidas:**
- `activos_corrientes`
- `activos_no_corrientes`
- `pasivos_corrientes`
- `pasivos_no_corrientes`
- `patrimonio_neto`

---

## 📝 CUÁNDO INSERTAR REGISTROS

Cuando un archivo se sube exitosamente en el endpoint `/api/subir-archivo`, debes:

1. Subir el archivo a GitHub/B2
2. Guardar el registro en la tabla `archivos`:

```python
# Ejemplo en Python
def guardar_metadata_archivo(empresa_id, nombre_archivo, categoria, ruta_github):
    cursor.execute("""
        INSERT INTO archivos (empresa_id, nombre, categoria, ruta_github, fecha_subida)
        VALUES (%s, %s, %s, %s, NOW())
    """, (empresa_id, nombre_archivo, categoria, ruta_github))
    db.commit()
```

---

## ✅ PRUEBA DEL ENDPOINT

Una vez implementado, prueba con:

```bash
curl -X GET "https://viny2030-com-ar.onrender.com/api/listar-archivos" \
     -H "X-API-Key: tu_api_key_aqui"
```

Deberías recibir:
```json
{
  "archivos": [
    {
      "nombre": "factura.pdf",
      "categoria": "activos_corrientes",
      "fecha": "2026-02-14T10:30:00Z"
    }
  ]
}
```

---

## 🆘 ¿NECESITAS AYUDA?

Dime:
1. ¿Qué lenguaje/framework usa tu backend?
2. ¿Tienes una tabla de archivos en tu base de datos?
3. ¿Cómo guardas actualmente los archivos? (GitHub, B2, local)

Y te ayudo a implementar el endpoint específicamente para tu caso.
