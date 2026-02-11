#!/usr/bin/env python3
"""
crear_repo_github.py - Crear repositorio privado en GitHub para cliente
Uso: python crear_repo_github.py "nombre-repo" "email@cliente.com"
"""

import sys
import os
import requests
from datetime import datetime

# Configuración
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', 'ghp_YOUR_TOKEN_HERE')
GITHUB_ORG = 'viny2030'  # O tu username si no es organización
GITHUB_API = 'https://api.github.com'

def crear_repositorio(nombre_repo, email_cliente):
    """Crear repositorio privado en GitHub"""
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    # Datos del repositorio
    repo_data = {
        'name': nombre_repo,
        'description': f'Contabilidad automatizada - Cliente: {email_cliente}',
        'private': True,
        'has_issues': True,
        'has_projects': False,
        'has_wiki': False,
        'auto_init': True,
        'gitignore_template': 'Python'
    }
    
    # Crear repositorio
    try:
        # Si es organización
        if GITHUB_ORG:
            url = f'{GITHUB_API}/orgs/{GITHUB_ORG}/repos'
        else:
            url = f'{GITHUB_API}/user/repos'
        
        response = requests.post(url, headers=headers, json=repo_data)
        response.raise_for_status()
        
        repo_info = response.json()
        print(f"✅ Repositorio creado: {repo_info['html_url']}")
        
        # Agregar archivos al repo
        agregar_archivos_iniciales(nombre_repo, headers)
        
        # Configurar GitHub Actions
        configurar_github_actions(nombre_repo, headers)
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al crear repositorio: {e}", file=sys.stderr)
        if hasattr(e, 'response') and e.response is not None:
            print(f"Respuesta: {e.response.text}", file=sys.stderr)
        return False

def agregar_archivos_iniciales(nombre_repo, headers):
    """Agregar archivos iniciales al repositorio"""
    
    archivos = {
        'README.md': generar_readme(),
        'requirements.txt': generar_requirements(),
        'config.py': generar_config(),
        'b2_connector.py': leer_template('b2_connector.py'),
        'balance_general.py': leer_template('balance_general.py'),
        'ratios_financieros.py': leer_template('ratios_financieros.py'),
        'verificar_estado.py': leer_template('verificar_estado.py')
    }
    
    for filename, content in archivos.items():
        crear_archivo_github(nombre_repo, filename, content, headers)

def crear_archivo_github(nombre_repo, filename, content, headers):
    """Crear archivo en GitHub"""
    
    url = f'{GITHUB_API}/repos/{GITHUB_ORG}/{nombre_repo}/contents/{filename}'
    
    import base64
    content_b64 = base64.b64encode(content.encode()).decode()
    
    data = {
        'message': f'Add {filename}',
        'content': content_b64
    }
    
    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"  ✅ Archivo creado: {filename}")
    except Exception as e:
        print(f"  ⚠️ Error al crear {filename}: {e}")

def configurar_github_actions(nombre_repo, headers):
    """Configurar GitHub Actions workflow"""
    
    workflow_content = leer_template('daily-sync.yml')
    
    # Crear directorio .github/workflows
    crear_archivo_github(
        nombre_repo, 
        '.github/workflows/daily-sync.yml',
        workflow_content,
        headers
    )

def generar_readme():
    """Generar README.md"""
    return f"""# Viny2030 - Contabilidad Automatizada

## 📊 Sistema de Contabilidad Automática

Este repositorio contiene los scripts de análisis financiero para tu empresa.

### 🔄 Sincronización Automática

GitHub Actions ejecuta análisis diarios automáticamente:
- Balance General
- Estado de Resultados  
- Ratios Financieros
- Análisis de Liquidez

### 📁 Estructura

```
/data/           → Datos contables (CSV/Excel)
/results/        → Reportes generados
/scripts/        → Scripts Python
```

### 🚀 Uso

Los reportes se generan automáticamente cada 24 horas.
Los resultados se suben a Backblaze B2.

---
Generado por Viny2030 - {datetime.now().strftime('%Y-%m-%d')}
"""

def generar_requirements():
    """Generar requirements.txt"""
    return """# Viny2030 Requirements
pandas==2.0.3
openpyxl==3.1.2
requests==2.31.0
b2sdk==1.24.1
python-dotenv==1.0.0
"""

def generar_config():
    """Generar config.py"""
    return """# config.py - Configuración Viny2030

import os
from dotenv import load_dotenv

load_dotenv()

# Backblaze B2
B2_KEY_ID = os.getenv('B2_KEY_ID')
B2_APP_KEY = os.getenv('B2_APP_KEY')
B2_BUCKET_NAME = os.getenv('B2_BUCKET_NAME')

# API Viny2030
API_KEY = os.getenv('VINY_API_KEY')
API_URL = os.getenv('VINY_API_URL', 'https://api.viny2030.com')

# Configuración
DATA_DIR = 'data'
RESULTS_DIR = 'results'
"""

def leer_template(filename):
    """Leer archivo template"""
    template_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'templates',
        filename
    )
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"⚠️ Template no encontrado: {filename}")
        return f"# {filename}\n# Template pendiente\n"

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python crear_repo_github.py <nombre-repo> <email-cliente>")
        sys.exit(1)
    
    nombre_repo = sys.argv[1]
    email_cliente = sys.argv[2]
    
    print(f"🔧 Creando repositorio: {nombre_repo}")
    print(f"📧 Cliente: {email_cliente}")
    
    success = crear_repositorio(nombre_repo, email_cliente)
    sys.exit(0 if success else 1)
