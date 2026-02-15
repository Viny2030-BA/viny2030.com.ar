"""
Módulo para crear bucket en Backblaze B2
Viny2030 - Sistema de Contabilidad Automatizada
"""

import os
from b2sdk.v2 import B2Api, InMemoryAccountInfo

def crear_bucket_b2(bucket_name, empresa_id):
    """
    Crea un bucket en Backblaze B2 para almacenar archivos de la empresa
    
    Args:
        bucket_name: Nombre único del bucket
        empresa_id: ID de la empresa en la base de datos
    
    Returns:
        True si se creó exitosamente, False si falla
    """
    
    # Obtener credenciales de B2 desde variables de entorno
    B2_APP_KEY_ID = os.getenv('B2_APPLICATION_KEY_ID')
    B2_APP_KEY = os.getenv('B2_APPLICATION_KEY')
    
    if not B2_APP_KEY_ID or not B2_APP_KEY:
        print("⚠️  Credenciales de B2 no configuradas (opcional)")
        print("    Configura B2_APPLICATION_KEY_ID y B2_APPLICATION_KEY para habilitar almacenamiento B2")
        return False
    
    try:
        # Inicializar B2 API
        info = InMemoryAccountInfo()
        b2_api = B2Api(info)
        
        # Autorizar
        print(f"🔐 Autorizando con Backblaze B2...")
        b2_api.authorize_account("production", B2_APP_KEY_ID, B2_APP_KEY)
        
        # Crear bucket
        print(f"📦 Creando bucket: {bucket_name}")
        
        bucket = b2_api.create_bucket(
            bucket_name,
            'allPrivate',  # Bucket privado
            bucket_info={
                'empresa_id': str(empresa_id),
                'created_by': 'viny2030_api'
            }
        )
        
        print(f"✅ Bucket B2 creado exitosamente: {bucket_name}")
        print(f"   Bucket ID: {bucket.id_}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear bucket B2: {str(e)}")
        return False


if __name__ == '__main__':
    """
    Test del módulo
    """
    print("🧪 TEST: Creando bucket de prueba...")
    
    if not os.getenv('B2_APPLICATION_KEY_ID'):
        print("❌ Configura las variables de entorno:")
        print("   export B2_APPLICATION_KEY_ID='tu_key_id'")
        print("   export B2_APPLICATION_KEY='tu_key'")
        exit(1)
    
    from datetime import datetime
    timestamp = datetime.now().strftime('%m%d%H%M')
    test_bucket = f'viny-test-{timestamp}'
    
    resultado = crear_bucket_b2(test_bucket, 999)
    
    if resultado:
        print(f"\n✅ TEST EXITOSO")
    else:
        print(f"\n❌ TEST FALLIDO")
