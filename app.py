from flask import Flask, request, jsonify, render_template
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
# AGREGAR: Especificar rutas explícitas para templates y static
template_dir = os.path.join(BASE_DIR, 'templates')
static_dir = os.path.join(BASE_DIR, 'static')

app = Flask(__name__, 
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/static')
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

@app.route('/')
def index():
    return jsonify({'mensaje': 'Viny2030 API activa', 'version': '2.1.0'})

@app.route('/dashboard')
def dashboard():
    """Renderiza el dashboard empresarial"""
    return render_template('dashboard.html')

@app.route('/api/crear-empresa', methods=['POST'])
def crear_empresa():
    """Registra una nueva empresa - Solo crea GitHub repo"""
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
                INSERT INTO empresas (nombre, email, telefono, api_key, fecha_expiracion, b2_bucket)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (nombre, email, telefono, api_key, fecha_expiracion, bucket_name))
            empresa_id = cursor.lastrowid
            
            # 2. Crear Repositorio en GitHub
            print(f"--- Iniciando creación de GitHub para: {repo_name} ---")
            github_url = crear_repositorio_github(repo_name, email)
            
            # VALIDACIÓN CRÍTICA: Si falla GitHub, detenemos todo
            if not github_url:
                raise Exception("GitHub devolvió NULL. Revisa el GITHUB_TOKEN y los permisos de la organización Viny2030-BA.")

            # 3. Actualizar registro con la URL de GitHub
            cursor.execute('''
                UPDATE empresas SET github_repo = ? WHERE id = ?
            ''', (github_url, empresa_id))
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
    """Endpoint para subir archivos a B2 (crea bucket si no existe)"""
    
    # Verificar API key en headers
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        return jsonify({'error': 'API key requerida en header X-API-Key'}), 401
    
    # Buscar empresa
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, nombre, b2_bucket, b2_bucket_created 
            FROM empresas 
            WHERE api_key = ?
        ''', (api_key,))
        empresa = cursor.fetchone()
        
        if not empresa:
            return jsonify({'error': 'API key inválida'}), 401
        
        empresa_id, nombre, bucket_name, bucket_created = empresa
    
    # Verificar si hay archivo
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo. Usa el campo "archivo" en el form-data'}), 400
    
    archivo = request.files['archivo']
    
    if archivo.filename == '':
        return jsonify({'error': 'Archivo sin nombre'}), 400
    
    try:
        # Crear bucket si no existe (primera vez)
        if not bucket_created:
            print(f"--- Primera subida: Creando bucket B2 para: {bucket_name} ---")
            bucket_resultado = crear_bucket_b2(bucket_name, empresa_id)
            
            if not bucket_resultado:
                return jsonify({'error': 'Error al crear bucket B2. Verifica las credenciales.'}), 500
            
            # Marcar bucket como creado
            with sqlite3.connect(DATABASE) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE empresas SET b2_bucket_created = 1 WHERE id = ?
                ''', (empresa_id,))
                conn.commit()
            
            print(f"EXITO: Bucket B2 creado exitosamente: {bucket_name}")
        else:
            print(f"--- Bucket B2 ya existe: {bucket_name} ---")
        
        # Aquí agregarías la lógica real para subir el archivo al bucket
        # Por ahora solo confirmamos que el bucket existe
        print(f"Subiendo archivo: {archivo.filename}")
        
        return jsonify({
            'mensaje': 'Archivo procesado exitosamente',
            'bucket': bucket_name,
            'archivo': archivo.filename,
            'empresa': nombre,
            'nota': 'Bucket B2 creado y listo para recibir archivos' if not bucket_created else 'Archivo agregado al bucket existente'
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

if __name__ == '__main__':
    init_db()
    # Usar puerto de variable de entorno para Render
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
