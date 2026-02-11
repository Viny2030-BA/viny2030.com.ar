# 🚀 Deploy Viny2030 en Render

## Pasos para Deployment

### 1. Preparar el Repositorio

1. Crea un nuevo repositorio en GitHub
2. Sube estos archivos:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Viny2030"
   git remote add origin https://github.com/TU_USUARIO/viny2030.git
   git push -u origin main
   ```

### 2. Configurar Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name**: viny2030
   - **Region**: Oregon (o la más cercana)
   - **Branch**: main
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

### 3. Variables de Entorno

En la sección "Environment", agrega estas variables:

#### GitHub (Opcional - para crear repos automáticamente)
- `GITHUB_TOKEN` = tu_token_personal_github
- `GITHUB_ORG` = tu_organizacion_github

#### Backblaze B2 (Opcional - para almacenamiento)
- `B2_KEY_ID` = tu_key_id_b2
- `B2_APP_KEY` = tu_app_key_b2

### 4. Deploy

Click en "Create Web Service" y espera a que termine el deployment (~5 min)

### 5. Probar la API

Tu API estará disponible en:
```
https://viny2030.onrender.com
```

Prueba con:
```bash
curl https://viny2030.onrender.com/

# Crear empresa
curl -X POST https://viny2030.onrender.com/api/crear-empresa \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Empresa S.A.",
    "email": "contacto@miempresa.com",
    "telefono": "+123456789"
  }'

# Verificar estado (usa el api_key que recibiste)
curl "https://viny2030.onrender.com/api/verificar-estado?api_key=TU_API_KEY"
```

## 📁 Archivos Importantes

- `app.py` - Aplicación Flask principal
- `requirements.txt` - Dependencias Python
- `render.yaml` - Configuración de Render
- `python/` - Scripts de GitHub y B2

## 🔄 Actualizar la App

```bash
git add .
git commit -m "Actualización"
git push
```

Render detectará los cambios y hará redeploy automáticamente.

## 🌐 Frontend

Para el frontend, tienes 2 opciones:

### Opción A: Render Static Site
1. Click en "New +" → "Static Site"
2. Conecta el mismo repositorio
3. **Publish directory**: `frontend`

### Opción B: Netlify/Vercel
Sube solo la carpeta `frontend/` a Netlify o Vercel

## 🔧 Troubleshooting

### Error: "Port already in use"
- Render asigna el puerto automáticamente via `PORT` env var
- El código ya está configurado para esto

### Error: "Module not found"
- Verifica que `requirements.txt` esté en la raíz
- Verifica que el Build Command sea correcto

### Base de datos no persiste
- En el plan Free, Render puede reiniciar el servidor
- Para producción, usa PostgreSQL de Render:
  - New + → PostgreSQL
  - Conecta tu web service
  - Actualiza `app.py` para usar PostgreSQL en vez de SQLite

## 💡 Tips

1. **HTTPS automático**: Render provee SSL gratis
2. **Logs**: Ve al dashboard → tu servicio → Logs
3. **Custom domain**: Settings → Custom Domain
4. **Auto-deploy**: Conecta GitHub para deploy automático

## 📞 Soporte

Si tienes problemas, revisa:
- [Render Docs](https://render.com/docs)
- [Logs en el dashboard](https://dashboard.render.com/)
