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

# Importar scripts de creación
import sys
sys.path.append('./python')
from crear_repo_github import crear_repositorio_github
from crear_estructura_b2 import crear_bucket_b2

app = Flask(__name__)
CORS(app)

# Configuración
DATABASE = 'viny2030.db'

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
        'mensaje': 'Viny2030 API',
        'version': '1.0',
        'endpoints': [
            '/api/crear-empresa',
            '/api/verificar-estado',
            '/api/obtener-datos'
        ]
    })

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    """Crear nueva empresa con repo GitHub y bucket B2"""
    try:
        data = request.json
        nombre = data.get('nombre')
        email = data.get('email')
        telefono = data.get('telefono', '')
        
        if not nombre or not email:
            return jsonify({'error': 'Nombre y email son requeridos'}), 400
        
        # Generar API key
        api_key = generar_api_key()
        
        # Fecha de expiración (7 días trial)
        fecha_expiracion = datetime.now() + timedelta(days=7)
        
        # Crear en base de datos
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO empresas (nombre, email, telefono, api_key, fecha_expiracion)
                VALUES (?, ?, ?, ?, ?)
            ''', (nombre, email, telefono, api_key, fecha_expiracion.isoformat()))
            
            empresa_id = cursor.lastrowid
            conn.commit()
            
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Crear repositorio GitHub (si hay token configurado)
        github_repo = None
        github_token = os.environ.get('GITHUB_TOKEN')
        if github_token:
            try:
                repo_name = f"viny-{email.split('@')[0]}-{empresa_id}"
                github_repo = crear_repositorio_github(repo_name, email)
                
                # Actualizar en BD
                cursor.execute('UPDATE empresas SET github_repo = ? WHERE id = ?', 
                             (github_repo, empresa_id))
                conn.commit()
            except Exception as e:
                print(f"Error creando repo GitHub: {e}")
        
        # Crear bucket B2 (si hay credenciales)
        b2_bucket = None
        b2_key_id = os.environ.get('B2_KEY_ID')
        b2_app_key = os.environ.get('B2_APP_KEY')
        if b2_key_id and b2_app_key:
            try:
                bucket_name = f"viny-{empresa_id}"
                b2_bucket = crear_bucket_b2(bucket_name, empresa_id)
                
                # Actualizar en BD
                cursor.execute('UPDATE empresas SET b2_bucket = ? WHERE id = ?', 
                             (b2_bucket, empresa_id))
                conn.commit()
            except Exception as e:
                print(f"Error creando bucket B2: {e}")
        
        conn.close()
        
        return jsonify({
            'exito': True,
            'mensaje': 'Empresa creada exitosamente',
            'api_key': api_key,
            'empresa_id': empresa_id,
            'github_repo': github_repo,
            'b2_bucket': b2_bucket,
            'fecha_expiracion': fecha_expiracion.isoformat(),
            'dias_trial': 7
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verificar-estado', methods=['GET'])
def verificar_estado():
    """Verificar estado de suscripción"""
    api_key = request.args.get('api_key')
    
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
    
    # Verificar expiración
    fecha_expiracion = datetime.fromisoformat(empresa['fecha_expiracion'])
    dias_restantes = (fecha_expiracion - datetime.now()).days
    
    activo = dias_restantes > 0
    
    return jsonify({
        'activo': activo,
        'nombre': empresa['nombre'],
        'email': empresa['email'],
        'estado': empresa['estado_suscripcion'],
        'dias_restantes': max(0, dias_restantes),
        'fecha_expiracion': empresa['fecha_expiracion'],
        'github_repo': empresa['github_repo'],
        'b2_bucket': empresa['b2_bucket']
    })

@app.route('/api/obtener-datos', methods=['GET'])
def obtener_datos():
    """Obtener datos de una empresa"""
    api_key = request.args.get('api_key')
    
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
        'telefono': empresa['telefono'],
        'github_repo': empresa['github_repo'],
        'b2_bucket': empresa['b2_bucket'],
        'estado': empresa['estado_suscripcion'],
        'fecha_creacion': empresa['fecha_creacion']
    })

@app.route('/api/empresas', methods=['GET'])
def listar_empresas():
    """Listar todas las empresas (solo para admin)"""
    # TODO: Agregar autenticación de admin
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, nombre, email, estado_suscripcion, fecha_creacion FROM empresas')
    empresas = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'empresas': empresas})

if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    # Obtener puerto de variable de entorno (Render)
    port = int(os.environ.get('PORT', 5000))
    
    # Modo debug solo en desarrollo
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)
