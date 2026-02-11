#!/usr/bin/env python3
"""
crear_estructura_b2.py - Crear bucket en Backblaze B2 para cliente
Uso: python crear_estructura_b2.py "nombre-bucket" "empresa_id"
"""

import sys
import os
from b2sdk.v2 import B2Api, InMemoryAccountInfo
from b2sdk.exception import B2Error

# Configuración
B2_KEY_ID = os.getenv('B2_KEY_ID', 'YOUR_KEY_ID')
B2_APP_KEY = os.getenv('B2_APP_KEY', 'YOUR_APP_KEY')

def crear_bucket_b2(nombre_bucket, empresa_id):
    """Crear bucket privado en Backblaze B2"""
    
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
        print(f"   ID: {bucket.id_}")
        
        # Crear estructura de carpetas
        crear_estructura_carpetas(bucket, b2_api)
        
        return True
        
    except B2Error as e:
        print(f"❌ Error B2: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}", file=sys.stderr)
        return False

def crear_estructura_carpetas(bucket, b2_api):
    """Crear estructura de carpetas en B2"""
    
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
    """Crear placeholder para simular carpeta en B2"""
    
    try:
        # B2 no tiene carpetas reales, usamos archivos .placeholder
        placeholder_path = f"{carpeta}.placeholder"
        placeholder_content = b"# Placeholder folder"
        
        bucket.upload_bytes(
            data_bytes=placeholder_content,
            file_name=placeholder_path,
            content_type='text/plain'
        )
        
        print(f"  ✅ Carpeta creada: {carpeta}")
        
    except Exception as e:
        print(f"  ⚠️ Error al crear {carpeta}: {e}")

def subir_archivo_inicial(bucket, b2_api):
    """Subir archivo README inicial"""
    
    readme_content = """# Viny2030 - Almacenamiento B2

Este bucket contiene los datos y reportes contables de tu empresa.

## Estructura:

- `/data/raw/` - Datos originales (CSV, Excel)
- `/data/processed/` - Datos procesados
- `/results/balance/` - Balances generales
- `/results/ratios/` - Ratios financieros
- `/results/estados/` - Estados de resultados
- `/backup/` - Respaldos
- `/logs/` - Logs de ejecución

Los archivos se sincronizan automáticamente desde GitHub Actions.
""".encode('utf-8')
    
    try:
        bucket.upload_bytes(
            data_bytes=readme_content,
            file_name='README.md',
            content_type='text/plain'
        )
        print(f"  ✅ README.md subido")
    except Exception as e:
        print(f"  ⚠️ Error al subir README: {e}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python crear_estructura_b2.py <nombre-bucket> <empresa_id>")
        sys.exit(1)
    
    nombre_bucket = sys.argv[1]
    empresa_id = sys.argv[2]
    
    print(f"🔧 Creando bucket B2: {nombre_bucket}")
    print(f"🏢 Empresa ID: {empresa_id}")
    
    success = crear_bucket_b2(nombre_bucket, empresa_id)
    sys.exit(0 if success else 1)
