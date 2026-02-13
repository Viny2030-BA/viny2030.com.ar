#!/usr/bin/env python3
"""
Script para actualizar la base de datos con las nuevas columnas
Ejecutar ANTES de deployar los nuevos archivos
"""

import sqlite3
import os

# Ruta de la base de datos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'viny2030.db')

def actualizar_base_datos():
    """Agregar columnas nuevas a la tabla empresas"""
    
    print("🔧 Actualizando base de datos...")
    
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Intentar agregar github_owner
        try:
            cursor.execute('ALTER TABLE empresas ADD COLUMN github_owner TEXT')
            print("✓ Columna github_owner agregada")
        except sqlite3.OperationalError:
            print("⚠ Columna github_owner ya existe")
        
        # Intentar agregar github_repo_name
        try:
            cursor.execute('ALTER TABLE empresas ADD COLUMN github_repo_name TEXT')
            print("✓ Columna github_repo_name agregada")
        except sqlite3.OperationalError:
            print("⚠ Columna github_repo_name ya existe")
        
        conn.commit()
        
        # Actualizar empresas existentes
        cursor.execute('SELECT id, github_repo FROM empresas WHERE github_owner IS NULL AND github_repo IS NOT NULL')
        empresas = cursor.fetchall()
        
        if empresas:
            print(f"\n📊 Actualizando {len(empresas)} empresas existentes...")
            
            for empresa_id, github_url in empresas:
                if github_url and 'github.com' in github_url:
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
                        
                        print(f"  ✓ Empresa {empresa_id}: {owner}/{repo_name}")
            
            conn.commit()
            print(f"\n✅ {len(empresas)} empresas actualizadas exitosamente")
        else:
            print("\n✅ No hay empresas existentes para actualizar")
        
        conn.close()
        
        print("\n🎉 Base de datos actualizada correctamente!")
        print("Ahora puedes deployar los nuevos archivos en Render")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False
    
    return True

if __name__ == '__main__':
    actualizar_base_datos()
