"""
Viny2030 - Backend Flask API
Sistema de contabilidad automatizada
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import sys
from datetime import datetime, timedelta

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

# Configuración de Base de Datos (Ruta absoluta para Render)
DATABASE = os.path.join(BASE_DIR, 'viny2030.db')

def init_db():
    """Función para asegurar que la tabla existe"""
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
    import secrets
    return 'viny_' + secrets.token_urlsafe(32)

@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'mensaje': 'Viny2030 API activa',
        'version': '1.0.2'
    })

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    # Aseguramos que la tabla existe antes de operar
    init_db()
    
    data = request.json
    if not data or 'nombre' not in data or 'email' not in data:
        return jsonify({'error': 'Faltan datos obligatorios'}), 400
    
    nombre = data['nombre']
    email = data['email']
    telefono = data.get('telefono', '')
    api_key = generar_api_key()
    
    repo_name = f"viny-{nombre.lower().replace(' ', '-')}-{datetime.now().strftime('%m%d')}"
    bucket_name = f"viny-storage-{nombre.lower().replace(' ', '-')}"
    
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # 1. Insertar registro inicial
        fecha_expiracion = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO empresas (nombre, email, telefono, api_key, fecha_expiracion)
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, email, telefono, api_key, fecha_expiracion))
        
        empresa_id = cursor.lastrowid
        
        # 2. Crear infraestructura
        github_url = crear_repositorio_github(repo_name, email)
        b2_res = crear_bucket_b2(bucket_name, empresa_id)
        
        # 3. Actualizar con resultados
        cursor.execute('''
            UPDATE empresas 
            SET github_repo = ?, b2_bucket = ? 
            WHERE id = ?
        ''', (github_url, bucket_name, empresa_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'mensaje': 'Éxito',
            'api_key': api_key,
            'github_repo': github_url,
            'b2_bucket': bucket_name
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'El email ya está registrado'}), 400
    except Exception as e:
        return jsonify({'error': f'Error detallado: {str(e)}'}), 500

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
