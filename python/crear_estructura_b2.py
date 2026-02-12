#!/usr/bin/env python3
"""
crear_estructura_b2.py - Crear bucket en Backblaze B2 para cliente
"""
import sys
import os
from b2sdk.v2 import B2Api, InMemoryAccountInfo
from b2sdk.exception import B2Error

def crear_bucket_b2(nombre_bucket, empresa_id):
    """Crear bucket privado en Backblaze B2 con estructura de carpetas"""
    
    # ✅ CORRECCIÓN: Leer las credenciales DENTRO de la función
    B2_KEY_ID = os.getenv('B2_APPLICATION_KEY_ID')
    B2_APP_KEY = os.getenv('B2_APPLICATION_KEY')
    
    # Debug para verificar
    print(f"🔍 DEBUG B2 - Key ID encontrado: {B2_KEY_ID is not None}")
    if B2_KEY_ID:
        print(f"🔍 DEBUG B2 - Key ID empieza con: {B2_KEY_ID[:10]}")
    
    # Validación crítica
    if not B2_KEY_ID or not B2_APP_KEY:
        print("❌ Error: Credenciales de B2 no configuradas en Render")
        print(f"   B2_APPLICATION_KEY_ID: {'✓' if B2_KEY_ID else '✗'}")
        print(f"   B2_APPLICATION_KEY: {'✓' if B2_APP_KEY else '✗'}")
        return None
    
    try:
        # Autenticar con B2
        info = InMemoryAccountInfo()
        b2_api = B2Api(info)
        b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        
        print(f"✅ Autenticado en Backblaze B2")
        
        # Crear bucket
        bucket = b2_api.create_bucket(
            nombre_bucket,
            'allPrivate',  # Bucket privado
            bucket_info={
                'empresa_id': str(empresa_id),
                'created_by': 'viny2030',
                'purpose': 'contabilidad'
            }
        )
        
        print(f"✅ Bucket creado: {nombre_bucket}")
        
        # Crear estructura de carpetas inicial
        crear_estructura_carpetas(bucket, b2_api)
        
        # Subir el archivo informativo inicial
        subir_archivo_inicial(bucket, b2_api)
        
        return nombre_bucket
        
    except B2Error as e:
        print(f"❌ Error B2: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error inesperado en B2: {e}", file=sys.stderr)
        return None

def crear_estructura_carpetas(bucket, b2_api):
    """Crear estructura de carpetas simuladas en B2"""
    carpetas = [
        'data/raw/',
        'data/processed/',
        'results/balance/',
        'results/ratios/',
        'results/estados/',
        'backup/',
        'logs/'
    ]
    
    for carpeta in carpetas:
        crear_carpeta_placeholder(bucket, b2_api, carpeta)

def crear_carpeta_placeholder(bucket, b2_api, carpeta):
    """B2 no tiene carpetas reales, usamos archivos .placeholder"""
    try:
        placeholder_path = f"{carpeta}.placeholder"
        placeholder_content = b"# Placeholder folder for Viny2030"
        
        bucket.upload_bytes(
            data_bytes=placeholder_content,
            file_name=placeholder_path,
            content_type='text/plain'
        )
        print(f"   ✅ Carpeta preparada: {carpeta}")
    except Exception as e:
        print(f"   ⚠️ No se pudo crear {carpeta}: {e}")

def subir_archivo_inicial(bucket, b2_api):
    """Subir archivo README inicial explicativo"""
    readme_content = """# Viny2030 - Almacenamiento B2
Este bucket contiene los datos y reportes contables de tu empresa.
Los archivos se sincronizan automáticamente.
""".encode('utf-8')
    
    try:
        bucket.upload_bytes(
            data_bytes=readme_content,
            file_name='README.md',
            content_type='text/plain'
        )
        print(f"   ✅ README.md subido al bucket")
    except Exception as e:
        print(f"   ⚠️ Error al subir README: {e}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python crear_estructura_b2.py <nombre-bucket> <empresa_id>")
        sys.exit(1)
    
    nom_bucket = sys.argv[1]
    id_emp = sys.argv[2]
    
    resultado = crear_bucket_b2(nom_bucket, id_emp)
    if resultado:
        print(f"🚀 Proceso B2 finalizado exitosamente.")
        sys.exit(0)
    else:
        sys.exit(1)
```

---

## 🚀 **Pasos siguientes:**

1. **Reemplaza** el archivo `python/crear_estructura_b2.py` con el código de arriba
2. **Guarda** el archivo
3. **Commit y push** a tu repositorio
4. **Espera** 2-3 minutos a que Render redespliegue
5. **Crea una nueva empresa** de prueba
6. **Revisa los logs** - deberías ver:
```
   🔍 DEBUG B2 - Key ID encontrado: True
   🔍 DEBUG B2 - Key ID empieza con: 005a7f47ac
   ✅ Autenticado en Backblaze B2
   ✅ Bucket creado: viny-storage-...
