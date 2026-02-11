#!/usr/bin/env python3
import sys
import os
import requests
from datetime import datetime

# Configuración - Asegúrate de que coincida con tu GitHub
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_ORG = 'Viny2030-BA'  # Nombre exacto de tu organización
GITHUB_API = 'https://api.github.com'

def crear_repositorio_github(nombre_repo, email_cliente):
    """Crear repositorio privado en GitHub y retornar su URL"""
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
            url = f'{GITHUB_API}/user/repos'
            response = requests.post(url, headers=headers, json=repo_data)

        response.raise_for_status()
        repo_info = response.json()
        
        print(f"✅ Repositorio creado exitosamente: {repo_info['html_url']}")
        return repo_info['html_url'] # ESTO permite que app.py reciba la URL
        
    except Exception as e:
        print(f"❌ Error al crear repositorio: {e}")
        return None
