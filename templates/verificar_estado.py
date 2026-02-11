#!/usr/bin/env python3
"""
verificar_estado.py - Verificar estado de suscripción
Se ejecuta antes de cada análisis para validar que la cuenta esté activa
"""

import os
import sys
import requests
from config import API_KEY, API_URL

def verificar_suscripcion():
    """Verificar estado de suscripción con API Viny2030"""
    
    if not API_KEY:
        print("❌ API_KEY no configurada")
        return False
    
    try:
        print("🔍 Verificando estado de suscripción...")
        
        response = requests.get(
            f"{API_URL}/verificar-estado",
            params={'api_key': API_KEY},
            timeout=10
        )
        
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            print(f"❌ Error: {data.get('error', 'Respuesta inválida')}")
            return False
        
        empresa = data.get('empresa', {})
        
        print(f"✅ Empresa: {empresa.get('nombre')}")
        print(f"   Estado: {empresa.get('estado')}")
        print(f"   Días restantes: {empresa.get('dias_restantes')}")
        
        # Verificar si está activa
        if not empresa.get('activa'):
            print("❌ Suscripción INACTIVA o EXPIRADA")
            print("   Por favor, renueva tu suscripción en https://viny2030.com")
            return False
        
        # Advertencia si quedan pocos días
        dias_restantes = empresa.get('dias_restantes', 0)
        if dias_restantes <= 3:
            print(f"⚠️ ADVERTENCIA: Tu suscripción vence en {dias_restantes} días")
        
        print("✅ Suscripción activa - Proceso puede continuar")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    if not verificar_suscripcion():
        sys.exit(1)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
