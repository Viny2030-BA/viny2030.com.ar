#!/usr/bin/env python3
import sys
import os
import requests
from datetime import datetime

# Configuración - Organización de GitHub
GITHUB_ORG = 'Viny2030-BA'  # Nombre exacto de tu organización
GITHUB_API = 'https://api.github.com'

def crear_repositorio_github(nombre_repo, email_cliente):
    """Crear repositorio privado en GitHub y retornar su URL"""
    
    # ✅ CAMBIO: Leer el token DENTRO de la función
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
    
    # Debug para verificar
    print(f"🔍 DEBUG - Token encontrado: {GITHUB_TOKEN is not None}")
    if GITHUB_TOKEN:
        print(f"🔍 DEBUG - Token empieza con: {GITHUB_TOKEN[:10]}")
    
    if not GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN no configurado en Render")
        return None
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    repo_data = {
        'name': nombre_repo,
        'description': f'Contabilidad automatizada - Cliente: {email_cliente}',
        'private': True,
        'auto_init': True,
        'gitignore_template': 'Python'
    }
    
    try:
        # Intentar crear en la organización
        url = f'{GITHUB_API}/orgs/{GITHUB_ORG}/repos'
        response = requests.post(url, headers=headers, json=repo_data)
        
        # Si falla (ej. si no es org), intentar en cuenta personal
        if response.status_code != 201:
            print(f"⚠️ Fallo en org (status {response.status_code}), intentando cuenta personal...")
            url = f'{GITHUB_API}/user/repos'
            response = requests.post(url, headers=headers, json=repo_data)
        
        response.raise_for_status()
        repo_info = response.json()
        
        print(f"✅ Repositorio creado exitosamente: {repo_info['html_url']}")
        return repo_info['html_url']
        
    except Exception as e:
        print(f"❌ Error al crear repositorio: {e}")
        if hasattr(e, 'response'):
            print(f"❌ Respuesta de GitHub: {e.response.text}")
        return None
