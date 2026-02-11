"""
Viny2030 - Backend Flask API
Sistema de contabilidad automatizada
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path
import sys

# Configuración de rutas para importar scripts desde la carpeta 'python'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'python'))

# Importar scripts de creación
try:
    from crear_repo_github import crear_repositorio_github
    from crear_estructura_b2 import crear_bucket_b2
except ImportError as e:
    print(f"Error importando módulos: {e}")

app = Flask(__name__)
CORS(app)

# Configuración de Base de Datos
DATABASE = os.path.join(BASE_DIR, 'viny2030.db')

def init_db():
    """Inicializar base de datos SQLite"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            telefono TEXT,
            api_key TEXT UNIQUE NOT NULL,
            github_repo TEXT,
            b2_bucket TEXT,
            estado_suscripcion TEXT DEFAULT 'trial',
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_expiracion DATETIME,
            precio_mensual REAL DEFAULT 29.99
        )
    ''')
    
    conn.commit()
    conn.close()

def generar_api_key():
    """Generar API key única"""
    import secrets
    return 'viny_' + secrets.token_urlsafe(32)

@app.route('/')
def index():
    """Endpoint raíz"""
    return jsonify({
        'status': 'online',
        'mensaje': 'Viny2030 API activa',
        'version': '1.0.1'
    })

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    """Crear nueva empresa e infraestructura"""
    data = request.json
    
    if not data or 'nombre' not in data or 'email' not in data:
        return jsonify({'error': 'Faltan datos obligatorios (nombre, email)'}), 400
    
    nombre = data['nombre']
    email = data['email']
    telefono = data.get('telefono', '')
    
    api_key = generar_api_key()
    
    # Nombres de infraestructura
    repo_name = f"viny-{nombre.lower().replace(' ', '-')}-{datetime.now().strftime('%m%d')}"
    bucket_name = f"viny-storage-{nombre.lower().replace(' ', '-')}"
    
    try:
        # 1. Conectar a la base de datos
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # 2. Insertar primero para obtener el ID real
        fecha_expiracion = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO empresas (nombre, email, telefono, api_key, fecha_expiracion)
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, email, telefono, api_key, fecha_expiracion))
        
        empresa_id = cursor.lastrowid # Obtenemos el ID generado
        
        # 3. Crear Infraestructura
        # GitHub (recibe nombre y email)
        github_url = crear_repositorio_github(repo_name, email)
        
        # Backblaze B2 (recibe nombre y el empresa_id obtenido arriba)
        b2_info = crear_bucket_b2(bucket_name, empresa_id)
        
        # 4. Actualizar el registro con las URLs/Nombres creados
        cursor.execute('''
            UPDATE empresas 
            SET github_repo = ?, b2_bucket = ? 
            WHERE id = ?
        ''', (github_url, bucket_name, empresa_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'mensaje': 'Empresa creada exitosamente',
            'api_key': api_key,
            'empresa_id': empresa_id,
            'github_repo': github_url,
            'b2_bucket': bucket_name,
            'fecha_expiracion': fecha_expiracion
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'El email ya está registrado'}), 400
    except Exception as e:
        return jsonify({'error': f'Error en el proceso: {str(e)}'}), 500

@app.route('/api/verificar-key', methods=['POST'])
def verificar_key():
    """Verificar API key"""
    data = request.json
    api_key = data.get('api_key')
    
    if not api_key:
        return jsonify({'error': 'API key requerida'}), 400
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM empresas WHERE api_key = ?', (api_key,))
    empresa = cursor.fetchone()
    conn.close()
    
    if not empresa:
        return jsonify({'error': 'API key inválida'}), 404
    
    return jsonify({
        'nombre': empresa['nombre'],
        'email': empresa['email'],
        'github_repo': empresa['github_repo'],
        'b2_bucket': empresa['b2_bucket'],
        'estado': empresa['estado_suscripcion']
    })

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
