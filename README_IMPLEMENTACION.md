# Viny2030 - Actualización con Categorías Contables

## 📋 Resumen de Cambios

Se han agregado 5 secciones de subida clasificadas por categoría contable:
1. **Activos Corrientes** 💵
2. **Activos No Corrientes** 🏢
3. **Pasivos Corrientes** 💳
4. **Pasivos No Corrientes** 🏦
5. **Patrimonio Neto** 💼

## 🔧 Archivos Modificados

### Archivos NUEVOS (versión 2):
- `crear_repo_github_v2.py` - Crea el repo Y las 5 carpetas automáticamente
- `dashboard_v2.html` - Dashboard con las 5 secciones de subida
- `dashboard_v2.js` - JavaScript con funcionalidad de categorías
- `app_v2.py` - Backend que maneja subidas por categoría a GitHub

### Archivos ORIGINALES (sin cambios):
- `crear_estructura_b2.py` - Sin modificar
- `dashboard.css` - Sin modificar (los estilos nuevos están inline en el HTML)

## 📦 Pasos de Implementación

### 1. Reemplazar archivos en tu proyecto

#### Opción A: Reemplazo directo
```bash
# Reemplazar el archivo de creación de repos
cp crear_repo_github_v2.py python/crear_repo_github.py

# Reemplazar el dashboard HTML
cp dashboard_v2.html templates/dashboard.html

# Reemplazar el JavaScript
cp dashboard_v2.js static/js/dashboard.js

# Reemplazar app.py
cp app_v2.py app.py
```

#### Opción B: Probar primero (recomendado)
```bash
# Renombrar los archivos originales como backup
mv python/crear_repo_github.py python/crear_repo_github_old.py
mv templates/dashboard.html templates/dashboard_old.html
mv static/js/dashboard.js static/js/dashboard_old.js
mv app.py app_old.py

# Copiar las nuevas versiones
cp crear_repo_github_v2.py python/crear_repo_github.py
cp dashboard_v2.html templates/dashboard.html
cp dashboard_v2.js static/js/dashboard.js
cp app_v2.py app.py
```

### 2. Actualizar la base de datos

El nuevo `app.py` necesita dos columnas nuevas en la tabla `empresas`:

```sql
ALTER TABLE empresas ADD COLUMN github_owner TEXT;
ALTER TABLE empresas ADD COLUMN github_repo_name TEXT;
```

O puedes hacerlo desde Python:

```python
import sqlite3

conn = sqlite3.connect('viny2030.db')
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE empresas ADD COLUMN github_owner TEXT')
    cursor.execute('ALTER TABLE empresas ADD COLUMN github_repo_name TEXT')
    conn.commit()
    print("✓ Columnas agregadas exitosamente")
except sqlite3.OperationalError as e:
    print(f"Las columnas ya existen: {e}")

conn.close()
```

### 3. Verificar variables de entorno

Asegúrate de que tienes configurado en Render:
```
GITHUB_TOKEN=tu_token_de_github
```

### 4. Deploy en Render

```bash
git add .
git commit -m "Agregar sistema de categorías contables"
git push origin main
```

Render detectará los cambios y hará el deploy automáticamente.

## ✨ Funcionalidades Nuevas

### Para Usuarios

1. **Dashboard actualizado** con 5 secciones de subida separadas
2. **Drag & Drop** en cada categoría individualmente
3. **Subida clasificada** - cada archivo va a su carpeta correspondiente
4. **Visual mejorado** - iconos y colores por categoría

### Para el Sistema

1. **Creación automática de carpetas** cuando se crea un repositorio nuevo
2. **Subida a GitHub** directa por categoría
3. **Tracking de owner y repo_name** en la base de datos
4. **Compatibilidad con B2** mantenida (opcional)

## 🔍 Cómo Funciona

### Al crear una empresa nueva:
1. Se crea el repositorio en GitHub
2. Automáticamente se crean 5 carpetas:
   - `activos_corrientes/`
   - `activos_no_corrientes/`
   - `pasivos_corrientes/`
   - `pasivos_no_corrientes/`
   - `patrimonio_neto/`

### Al subir un archivo:
1. Usuario selecciona categoría en el dashboard
2. Archivo se sube a la carpeta correspondiente en GitHub
3. Ruta final: `{owner}/{repo}/{categoria}/{nombre_archivo}`

## 🧪 Pruebas

### Probar en local:
```bash
python app.py
# Abrir http://localhost:5000/dashboard
```

### Probar funcionalidad:
1. Crear una empresa nueva (verifica que se creen las 5 carpetas en GitHub)
2. Login con la API key
3. Subir archivos en cada categoría
4. Verificar en GitHub que los archivos están en la carpeta correcta

## ⚠️ Notas Importantes

### Empresas Existentes
Las empresas creadas ANTES de esta actualización:
- NO tienen `github_owner` ni `github_repo_name` en la DB
- Necesitarás actualizar manualmente o crear las carpetas en sus repos

Script para actualizar empresas existentes:

```python
import sqlite3
import requests
import os

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_API = 'https://api.github.com'

conn = sqlite3.connect('viny2030.db')
cursor = conn.cursor()

# Obtener empresas sin owner
cursor.execute('SELECT id, github_repo FROM empresas WHERE github_owner IS NULL')
empresas = cursor.fetchall()

for empresa_id, github_url in empresas:
    if github_url:
        # Extraer owner y repo_name del URL
        # Ejemplo: https://github.com/Viny2030-BA/viny-empresa-123
        parts = github_url.replace('https://github.com/', '').split('/')
        if len(parts) >= 2:
            owner = parts[0]
            repo_name = parts[1]
            
            cursor.execute('''
                UPDATE empresas 
                SET github_owner = ?, github_repo_name = ? 
                WHERE id = ?
            ''', (owner, repo_name, empresa_id))
            
            print(f"✓ Actualizado empresa {empresa_id}: {owner}/{repo_name}")

conn.commit()
conn.close()
```

### Rollback
Si algo falla, puedes volver a los archivos originales:
```bash
mv python/crear_repo_github_old.py python/crear_repo_github.py
mv templates/dashboard_old.html templates/dashboard.html
mv static/js/dashboard_old.js static/js/dashboard.js
mv app_old.py app.py

git add .
git commit -m "Rollback a versión anterior"
git push origin main
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica que GITHUB_TOKEN tenga permisos de escritura
3. Confirma que las columnas de DB fueron agregadas
4. Prueba en local primero

## 🎯 Próximos Pasos (Opcional)

- Agregar listado de archivos por categoría
- Agregar descarga de archivos desde el dashboard
- Agregar eliminación de archivos
- Agregar búsqueda de archivos
