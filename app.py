from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import sys
from datetime import datetime, timedelta

# Configuración de rutas para encontrar los módulos en la carpeta 'python'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'python'))

try:
    from crear_repo_github import crear_repositorio_github
    from crear_estructura_b2 import crear_bucket_b2
except ImportError as e:
    print(f"⚠️ Error importando módulos: {e}")

app = Flask(__name__)
CORS(app)
DATABASE = os.path.join(BASE_DIR, 'viny2030.db')

def init_db():
    """Inicializa la base de datos y crea la tabla si no existe."""
    with sqlite3.connect(DATABASE) as conn:
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

def generar_api_key():
    """Genera una clave de API segura."""
    import secrets
    return 'viny_' + secrets.token_urlsafe(32)

@app.route('/')
def index():
    return jsonify({'mensaje': 'Viny2030 API activa', 'version': '1.0.5'})

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    init_db()
    data = request.json
    
    # Validación de datos de entrada
    if not data or 'nombre' not in data or 'email' not in data:
        return jsonify({'error': 'Faltan datos (nombre o email)'}), 400
    
    nombre = data['nombre']
    email = data['email']
    api_key = generar_api_key()
    
    # Nombres únicos para la infraestructura
    timestamp = datetime.now().strftime('%m%d%H%M') # Añadimos hora/min para evitar duplicados
    repo_name = f"viny-{nombre.lower().replace(' ', '-')}-{timestamp}"
    bucket_name = f"viny-storage-{nombre.lower().replace(' ', '-')}-{timestamp}"
    
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            fecha_expiracion = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
            
            # 1. Insertar registro inicial en la DB
            cursor.execute('''
                INSERT INTO empresas (nombre, email, api_key, fecha_expiracion)
                VALUES (?, ?, ?, ?)
            ''', (nombre, email, api_key, fecha_expiracion))
            empresa_id = cursor.lastrowid
            
            # 2. Intentar crear Repositorio en GitHub
            print(f"--- Iniciando creación de GitHub para: {repo_name} ---")
            github_url = crear_repositorio_github(repo_name, email)
            
            # VALIDACIÓN CRÍTICA: Si falla GitHub, detenemos todo
            if not github_url:
                raise Exception("GitHub devolvió NULL. Revisa el GITHUB_TOKEN y los permisos de la organización Viny2030-BA.")

            # 3. Intentar crear Bucket en Backblaze B2
            print(f"--- Iniciando creación de B2 para: {bucket_name} ---")
            b2_res = crear_bucket_b2(bucket_name, empresa_id)
            
            # 4. Actualizar registro con las URLs creadas
            cursor.execute('''
                UPDATE empresas SET github_repo = ?, b2_bucket = ? WHERE id = ?
            ''', (github_url, bucket_name, empresa_id))
            conn.commit()
            
        return jsonify({
            'mensaje': 'Infraestructura creada con éxito',
            'api_key': api_key,
            'github_repo': github_url,
            'b2_bucket': bucket_name
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': f'El email {email} ya está registrado en el sistema.'}), 400
    except Exception as e:
        # Si algo falla, el mensaje de error será específico
        print(f"❌ ERROR EN SISTEMA: {str(e)}")
        return jsonify({
            'error': 'Fallo en la creación de infraestructura',
            'detalle': str(e)
        }), 500

if __name__ == '__main__':
    init_db()
    # Usar puerto de variable de entorno para Render
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
