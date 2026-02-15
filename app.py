import os
import sqlite3
import sys
from datetime import datetime, timedelta
import requests
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

# Configuración de rutas para encontrar los módulos en la carpeta 'python'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'python'))

try:
    from crear_repo_github import crear_repositorio_github
    from crear_estructura_b2 import crear_bucket_b2
except ImportError as e:
    print(f"⚠️ Error importando módulos: {e}")

# Especificar rutas explícitas para templates y static
template_dir = os.path.join(BASE_DIR, 'templates')
static_dir = os.path.join(BASE_DIR, 'static')

# CREAR LA APP UNA SOLA VEZ
app = Flask(__name__, 
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/static')
CORS(app)

# Configuración
DATABASE = os.path.join(BASE_DIR, 'viny2030.db')
GITHUB_API = 'https://api.github.com'
API_KEY = os.environ.get('API_KEY')

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
                github_owner TEXT,
                github_repo_name TEXT,
                b2_bucket TEXT,
                b2_bucket_created INTEGER DEFAULT 0,
                estado_suscripcion TEXT DEFAULT 'trial',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_expiracion DATETIME,
                precio_mensual REAL DEFAULT 29.99,
                activos_corrientes REAL DEFAULT 0,
                activos_no_corrientes REAL DEFAULT 0,
                pasivos_corrientes REAL DEFAULT 0,
                pasivos_no_corrientes REAL DEFAULT 0,
                patrimonio_neto REAL DEFAULT 0
            )
        ''')
        conn.commit()

def generar_api_key():
    """Genera una clave de API segura."""
    import secrets
    return 'viny_' + secrets.token_urlsafe(32)

def subir_archivo_a_github(owner, repo_name, categoria, filename, content):
    """Sube un archivo a GitHub en la carpeta de la categoría especificada"""
    
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
    if not GITHUB_TOKEN:
        print("ERROR: GITHUB_TOKEN no configurado")
        return False
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    # Convertir contenido a base64
    import base64
    content_base64 = base64.b64encode(content).decode('utf-8')
    
    # Ruta del archivo en el repositorio
    file_path = f"{categoria}/{filename}"
    
    try:
        # Crear/actualizar archivo en GitHub
        url = f'{GITHUB_API}/repos/{owner}/{repo_name}/contents/{file_path}'
        
        data = {
            'message': f'Subir archivo a {categoria}: {filename}',
            'content': content_base64
        }
        
        response = requests.put(url, headers=headers, json=data)
        
        if response.status_code in [201, 200]:
            print(f"✓ Archivo subido exitosamente: {file_path}")
            return True
        else:
            print(f"⚠ Error al subir archivo: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR al subir archivo a GitHub: {e}")
        return False

# =====================================================
# RUTAS PRINCIPALES
# =====================================================

@app.route('/')
def index():
    """Página principal - redirige al dashboard demo"""
    return jsonify({
        'mensaje': 'Viny2030 API activa', 
        'version': '2.3.0',
        'endpoints': {
            'dashboard_demo': '/demo',
            'dashboard_empresarial': '/dashboard',
            'api_crear_empresa': '/api/crear-empresa',
            'api_subir_archivo': '/api/subir-archivo'
        }
    })

@app.route('/demo')
def demo():
    """Sirve el dashboard demo con datos de ejemplo"""
    try:
        return send_from_directory(BASE_DIR, 'dashboard_DEMO.html')
    except Exception as e:
        return jsonify({'error': f'Dashboard demo no encontrado: {str(e)}'}), 404

@app.route('/dashboard')
def dashboard():
    """Renderiza el dashboard empresarial desde templates"""
    return render_template('dashboard.html')

# Ruta genérica para servir archivos estáticos desde la raíz
@app.route('/<path:filename>')
def serve_static_files(filename):
    """Sirve archivos estáticos (HTML, JS, CSS, ICO, etc.) desde la raíz del proyecto"""
    # Lista de extensiones permitidas
    allowed_extensions = ['.html', '.js', '.css', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.json']
    
    # Verificar si el archivo tiene una extensión permitida
    if any(filename.endswith(ext) for ext in allowed_extensions):
        try:
            return send_from_directory(BASE_DIR, filename)
        except Exception as e:
            return jsonify({'error': f'Archivo {filename} no encontrado'}), 404
    else:
        return jsonify({'error': 'Tipo de archivo no permitido'}), 400

# =====================================================
# API ENDPOINTS
# =====================================================

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    """Registra una nueva empresa - Crea GitHub repo con estructura de carpetas"""
    init_db()
    data = request.json
    
    # Validación de datos de entrada
    if not data or 'nombre' not in data or 'email' not in data:
        return jsonify({'error': 'Faltan datos (nombre o email)'}), 400
    
    nombre = data['nombre']
    email = data['email']
    telefono = data.get('telefono', '')
    api_key = generar_api_key()
    
    # Nombres únicos para la infraestructura
    timestamp = datetime.now().strftime('%m%d%H%M')
    repo_name = f"viny-{nombre.lower().replace(' ', '-')}-{timestamp}"
    bucket_name = f"viny-storage-{nombre.lower().replace(' ', '-')}-{timestamp}"
    
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            fecha_expiracion = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
            
            # 1. Insertar registro inicial en la DB
            cursor.execute('''
                INSERT INTO empresas (nombre, email, telefono, api_key, fecha_expiracion, b2_bucket, github_repo_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (nombre, email, telefono, api_key, fecha_expiracion, bucket_name, repo_name))
            empresa_id = cursor.lastrowid
            
            # 2. Crear Repositorio en GitHub con las 5 carpetas
            print(f"--- Iniciando creación de GitHub para: {repo_name} ---")
            github_url = crear_repositorio_github(repo_name, email)
            
            # VALIDACIÓN CRÍTICA: Si falla GitHub, detenemos todo
            if not github_url:
                raise Exception("GitHub devolvió NULL. Revisa el GITHUB_TOKEN y los permisos.")

            # Obtener el owner del repo (organización o usuario)
            GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
            headers = {
                'Authorization': f'token {GITHUB_TOKEN}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            # Intentar obtener info de la organización
            org_response = requests.get(f'{GITHUB_API}/orgs/Viny2030-BA', headers=headers)
            if org_response.status_code == 200:
                owner = 'Viny2030-BA'
            else:
                # Si no es org, obtener usuario
                user_response = requests.get(f'{GITHUB_API}/user', headers=headers)
                if user_response.status_code == 200:
                    owner = user_response.json()['login']
                else:
                    owner = 'Viny2030-BA'  # fallback

            # 3. Actualizar registro con la URL de GitHub y owner
            cursor.execute('''
                UPDATE empresas SET github_repo = ?, github_owner = ? WHERE id = ?
            ''', (github_url, owner, empresa_id))
            conn.commit()
            
            print(f"EXITO: Empresa {nombre} registrada exitosamente (ID: {empresa_id})")
            
        return jsonify({
            'mensaje': 'Empresa registrada exitosamente',
            'empresa_id': empresa_id,
            'api_key': api_key,
            'github_repo': github_url,
            'b2_bucket': f'Se creará automáticamente al subir el primer archivo: {bucket_name}',
            'instrucciones': 'Usa el endpoint /api/subir-archivo con tu API key para comenzar a subir documentos'
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': f'El email {email} ya está registrado en el sistema.'}), 400
    except Exception as e:
        print(f"ERROR EN SISTEMA: {str(e)}")
        return jsonify({
            'error': 'Fallo en el registro de empresa',
            'detalle': str(e)
        }), 500

@app.route('/api/empresa/<api_key>', methods=['GET'])
def obtener_empresa(api_key):
    """Obtiene la información de una empresa por su API key"""
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, nombre, email, telefono, github_repo, b2_bucket, 
                       b2_bucket_created, estado_suscripcion, fecha_creacion, 
                       fecha_expiracion, precio_mensual,
                       activos_corrientes, activos_no_corrientes,
                       pasivos_corrientes, pasivos_no_corrientes, patrimonio_neto
                FROM empresas 
                WHERE api_key = ?
            ''', (api_key,))
            
            empresa = cursor.fetchone()
            
            if not empresa:
                return jsonify({'error': 'API key inválida'}), 404
            
            return jsonify({
                'id': empresa[0],
                'nombre': empresa[1],
                'email': empresa[2],
                'telefono': empresa[3],
                'github_repo': empresa[4],
                'b2_bucket': empresa[5],
                'b2_bucket_created': bool(empresa[6]),
                'estado_suscripcion': empresa[7],
                'fecha_creacion': empresa[8],
                'fecha_expiracion': empresa[9],
                'precio_mensual': empresa[10],
                'activos_corrientes': empresa[11],
                'activos_no_corrientes': empresa[12],
                'pasivos_corrientes': empresa[13],
                'pasivos_no_corrientes': empresa[14],
                'patrimonio_neto': empresa[15]
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/actualizar-datos-contables', methods=['POST'])
def actualizar_datos_contables():
    """Actualizar información contable de una empresa"""
    
    # Verificar API key
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        return jsonify({'error': 'API key requerida en header X-API-Key'}), 401
    
    data = request.json
    
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            
            # Verificar que la empresa existe
            cursor.execute('SELECT id FROM empresas WHERE api_key = ?', (api_key,))
            empresa = cursor.fetchone()
            
            if not empresa:
                return jsonify({'error': 'API key inválida'}), 401
            
            empresa_id = empresa[0]
            
            # Actualizar datos contables
            cursor.execute('''
                UPDATE empresas 
                SET activos_corrientes = ?,
                    activos_no_corrientes = ?,
                    pasivos_corrientes = ?,
                    pasivos_no_corrientes = ?,
                    patrimonio_neto = ?
                WHERE id = ?
            ''', (
                data.get('activos_corrientes', 0),
                data.get('activos_no_corrientes', 0),
                data.get('pasivos_corrientes', 0),
                data.get('pasivos_no_corrientes', 0),
                data.get('patrimonio_neto', 0),
                empresa_id
            ))
            conn.commit()
            
            return jsonify({
                'mensaje': 'Datos contables actualizados exitosamente'
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subir-archivo', methods=['POST'])
def subir_archivo():
    """Endpoint para subir archivos a GitHub por categoría (y B2 si está configurado)"""
    
    # Verificar API key en headers
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        return jsonify({'error': 'API key requerida en header X-API-Key'}), 401
    
    # Buscar empresa
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, nombre, github_owner, github_repo_name, b2_bucket, b2_bucket_created 
            FROM empresas 
            WHERE api_key = ?
        ''', (api_key,))
        empresa = cursor.fetchone()
        
        if not empresa:
            return jsonify({'error': 'API key inválida'}), 401
        
        empresa_id, nombre, github_owner, github_repo_name, bucket_name, bucket_created = empresa
    
    # Verificar si hay archivo
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo. Usa el campo "archivo" en el form-data'}), 400
    
    # Obtener categoría
    categoria = request.form.get('categoria', 'sin_clasificar')
    
    archivo = request.files['archivo']
    
    if archivo.filename == '':
        return jsonify({'error': 'Archivo sin nombre'}), 400
    
    try:
        # Leer contenido del archivo
        archivo_content = archivo.read()
        
        # Subir a GitHub
        print(f"--- Subiendo archivo a GitHub: {archivo.filename} en categoría: {categoria} ---")
        
        if not github_owner or not github_repo_name:
            return jsonify({'error': 'Repositorio GitHub no configurado para esta empresa'}), 500
        
        resultado_github = subir_archivo_a_github(
            github_owner, 
            github_repo_name, 
            categoria, 
            archivo.filename, 
            archivo_content
        )
        
        if not resultado_github:
            return jsonify({'error': 'Error al subir archivo a GitHub'}), 500
        
        # Crear bucket B2 si no existe (primera vez) - OPCIONAL
        if not bucket_created and bucket_name:
            print(f"--- Primera subida: Creando bucket B2 para: {bucket_name} ---")
            bucket_resultado = crear_bucket_b2(bucket_name, empresa_id)
            
            if bucket_resultado:
                # Marcar bucket como creado
                with sqlite3.connect(DATABASE) as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        UPDATE empresas SET b2_bucket_created = 1 WHERE id = ?
                    ''', (empresa_id,))
                    conn.commit()
                print(f"EXITO: Bucket B2 creado exitosamente: {bucket_name}")
        
        return jsonify({
            'mensaje': 'Archivo subido exitosamente',
            'categoria': categoria,
            'archivo': archivo.filename,
            'empresa': nombre,
            'repositorio': f'{github_owner}/{github_repo_name}',
            'ruta': f'{categoria}/{archivo.filename}'
        }), 200
        
    except Exception as e:
        print(f"ERROR al subir archivo: {str(e)}")
        return jsonify({
            'error': 'Error al procesar archivo',
            'detalle': str(e)
        }), 500

@app.route('/api/listar-empresas', methods=['GET'])
def listar_empresas():
    """Lista todas las empresas registradas (para administración)"""
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, nombre, email, estado_suscripcion, 
                       fecha_creacion, fecha_expiracion, b2_bucket_created
                FROM empresas
                ORDER BY fecha_creacion DESC
            ''')
            empresas = cursor.fetchall()
            
            return jsonify({
                'total': len(empresas),
                'empresas': [
                    {
                        'id': e[0],
                        'nombre': e[1],
                        'email': e[2],
                        'estado': e[3],
                        'fecha_creacion': e[4],
                        'fecha_expiracion': e[5],
                        'bucket_activo': bool(e[6])
                    }
                    for e in empresas
                ]
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# HEALTH CHECK
# =====================================================

@app.route('/health')
def health():
    """Health check para Render"""
    return jsonify({
        'status': 'healthy',
        'version': '2.3.0',
        'database': 'connected' if os.path.exists(DATABASE) else 'not_found'
    }), 200

# =====================================================
# INICIO DE LA APLICACIÓN
# =====================================================

if __name__ == '__main__':
    init_db()
    # Usar puerto de variable de entorno para Render
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
