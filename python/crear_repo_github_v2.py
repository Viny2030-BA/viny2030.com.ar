#!/usr/bin/env python3
import sys
import os
import requests
from datetime import datetime

# Configuración - Organización de GitHub
GITHUB_ORG = 'Viny2030-BA'
GITHUB_API = 'https://api.github.com'

def crear_estructura_carpetas(owner, repo_name, github_token):
    """Crear las 5 carpetas contables en el repositorio"""
    
    carpetas = [
        'activos_corrientes',
        'activos_no_corrientes',
        'pasivos_corrientes',
        'pasivos_no_corrientes',
        'patrimonio_neto'
    ]
    
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    for carpeta in carpetas:
        try:
            # Crear un archivo .gitkeep en cada carpeta para que se cree la estructura
            url = f'{GITHUB_API}/repos/{owner}/{repo_name}/contents/{carpeta}/.gitkeep'
            
            data = {
                'message': f'Crear carpeta {carpeta}',
                'content': ''  # Archivo vacío
            }
            
            response = requests.put(url, headers=headers, json=data)
            
            if response.status_code == 201:
                print(f"✓ Carpeta creada: {carpeta}")
            else:
                print(f"⚠ Error al crear carpeta {carpeta}: {response.status_code}")
                
        except Exception as e:
            print(f"⚠ Error al crear carpeta {carpeta}: {e}")
    
    print(f"EXITO: Estructura de carpetas creada en el repositorio")

def crear_repositorio_github(nombre_repo, email_cliente):
    """Crear repositorio privado en GitHub y retornar su URL"""
    
    # Leer el token DENTRO de la función
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
    
    # Debug para verificar
    print(f"DEBUG - Token encontrado: {GITHUB_TOKEN is not None}")
    if GITHUB_TOKEN:
        print(f"DEBUG - Token empieza con: {GITHUB_TOKEN[:10]}")
    
    if not GITHUB_TOKEN:
        print("ERROR: GITHUB_TOKEN no configurado en Render")
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
        
        owner = GITHUB_ORG
        
        # Si falla (ej. si no es org), intentar en cuenta personal
        if response.status_code != 201:
            print(f"ADVERTENCIA: Fallo en org (status {response.status_code}), intentando cuenta personal...")
            url = f'{GITHUB_API}/user/repos'
            response = requests.post(url, headers=headers, json=repo_data)
            
            # Si es cuenta personal, obtener el nombre del usuario
            if response.status_code == 201:
                user_response = requests.get(f'{GITHUB_API}/user', headers=headers)
                if user_response.status_code == 200:
                    owner = user_response.json()['login']
        
        response.raise_for_status()
        repo_info = response.json()
        
        print(f"EXITO: Repositorio creado exitosamente: {repo_info['html_url']}")
        
        # CREAR LAS 5 CARPETAS CONTABLES
        print(f"--- Creando estructura de carpetas contables ---")
        crear_estructura_carpetas(owner, nombre_repo, GITHUB_TOKEN)
        
        return repo_info['html_url']
        
    except Exception as e:
        print(f"ERROR al crear repositorio: {e}")
        if hasattr(e, 'response'):
            print(f"ERROR - Respuesta de GitHub: {e.response.text}")
        return None
