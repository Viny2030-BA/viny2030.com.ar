#!/usr/bin/env python3
"""
b2_connector.py - Conector para Backblaze B2
Maneja subida y descarga de archivos
"""

import os
import sys
from b2sdk.v2 import B2Api, InMemoryAccountInfo
from b2sdk.exception import B2Error
from config import B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME, DATA_DIR, RESULTS_DIR

class B2Connector:
    def __init__(self):
        self.info = InMemoryAccountInfo()
        self.b2_api = B2Api(self.info)
        self.bucket = None
        
    def authenticate(self):
        """Autenticar con B2"""
        try:
            self.b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
            self.bucket = self.b2_api.get_bucket_by_name(B2_BUCKET_NAME)
            print(f"✅ Conectado a bucket: {B2_BUCKET_NAME}")
            return True
        except B2Error as e:
            print(f"❌ Error de autenticación: {e}")
            return False
    
    def download_files(self, remote_path='data/raw/', local_path=None):
        """Descargar archivos de B2"""
        if not self.bucket:
            if not self.authenticate():
                return False
        
        if local_path is None:
            local_path = DATA_DIR
        
        os.makedirs(local_path, exist_ok=True)
        
        try:
            # Listar archivos en el path remoto
            files = list(self.bucket.ls(remote_path))
            
            for file_info, _ in files:
                filename = os.path.basename(file_info.file_name)
                if filename.startswith('.'):
                    continue
                
                local_file = os.path.join(local_path, filename)
                
                print(f"📥 Descargando: {filename}")
                self.bucket.download_file_by_name(file_info.file_name, local_file)
            
            print(f"✅ Descarga completada: {len(files)} archivos")
            return True
            
        except Exception as e:
            print(f"❌ Error en descarga: {e}")
            return False
    
    def upload_files(self, local_path=None, remote_path='results/'):
        """Subir archivos a B2"""
        if not self.bucket:
            if not self.authenticate():
                return False
        
        if local_path is None:
            local_path = RESULTS_DIR
        
        if not os.path.exists(local_path):
            print(f"⚠️ Path no existe: {local_path}")
            return False
        
        try:
            uploaded_count = 0
            
            for root, dirs, files in os.walk(local_path):
                for filename in files:
                    if filename.startswith('.'):
                        continue
                    
                    local_file = os.path.join(root, filename)
                    
                    # Calcular path relativo
                    rel_path = os.path.relpath(local_file, local_path)
                    remote_file = os.path.join(remote_path, rel_path).replace('\\', '/')
                    
                    print(f"📤 Subiendo: {filename} → {remote_file}")
                    
                    self.bucket.upload_local_file(
                        local_file=local_file,
                        file_name=remote_file
                    )
                    
                    uploaded_count += 1
            
            print(f"✅ Subida completada: {uploaded_count} archivos")
            return True
            
        except Exception as e:
            print(f"❌ Error en subida: {e}")
            return False
    
    def list_files(self, remote_path=''):
        """Listar archivos en B2"""
        if not self.bucket:
            if not self.authenticate():
                return []
        
        try:
            files = list(self.bucket.ls(remote_path))
            print(f"\n📁 Archivos en {remote_path or 'root'}:")
            for file_info, _ in files:
                print(f"  - {file_info.file_name} ({file_info.size} bytes)")
            return files
        except Exception as e:
            print(f"❌ Error al listar: {e}")
            return []

def main():
    if len(sys.argv) < 2:
        print("Uso: python b2_connector.py [download|upload|list] [path]")
        sys.exit(1)
    
    command = sys.argv[1]
    path = sys.argv[2] if len(sys.argv) > 2 else None
    
    connector = B2Connector()
    
    if command == 'download':
        connector.download_files()
    elif command == 'upload':
        connector.upload_files()
    elif command == 'list':
        connector.list_files(path or '')
    else:
        print(f"❌ Comando desconocido: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()
