#!/usr/bin/env python3
"""
crear_repo_github.py - Crear repositorio privado en GitHub para cliente
"""

import sys
import os
import requests
from datetime import datetime

# Configuración
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', 'ghp_YOUR_TOKEN_HERE')
GITHUB_ORG = 'viny2030'  # O tu username si no es organización
GITHUB_API = 'https://api.github.com'

def crear_repositorio_github(nombre_repo, email_cliente):
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
    
    try:
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
        
        return repo_info['html_url'] # Retornamos la URL para guardarla en la BD
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al crear repositorio: {e}", file=sys.stderr)
        return None

def agregar_archivos_iniciales(nombre_repo, headers):
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
    url = f'{GITHUB_API}/repos/{GITHUB_ORG}/{nombre_repo}/contents/{filename}'
    import base64
    content_b64 = base64.b64encode(content.encode()).decode()
    data = {'message': f'Add {filename}', 'content': content_b64}
    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
    except Exception as e:
        print(f"  ⚠️ Error al crear {filename}: {e}")

def configurar_github_actions(nombre_repo, headers):
    workflow_content = leer_template('daily-sync.yml')
    crear_archivo_github(nombre_repo, '.github/workflows/daily-sync.yml', workflow_content, headers)

def generar_readme():
    return f"# Viny2030 - Contabilidad Automatizada\nGenerado: {datetime.now().strftime('%Y-%m-%d')}"

def generar_requirements():
    return "pandas==2.0.3\nopenpyxl==3.1.2\nrequests==2.31.0\nb2sdk==1.24.1\npython-dotenv==1.0.0"

def generar_config():
    return "# config.py\nimport os"

def leer_template(filename):
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', filename)
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return f"# {filename}\n# Template pendiente\n"

if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(1)
    crear_repositorio_github(sys.argv[1], sys.argv[2])
