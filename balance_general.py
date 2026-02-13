#!/usr/bin/env python3
"""
balance_general.py - Generar Balance General
Lee datos contables y genera balance general en formato Excel/PDF
"""

import os
import pandas as pd
from datetime import datetime
from config import DATA_DIR, RESULTS_DIR

class BalanceGeneral:
    def __init__(self):
        self.activos = {}
        self.pasivos = {}
        self.patrimonio = {}
        
    def cargar_datos(self, archivo='cuentas.csv'):
        """Cargar datos contables desde CSV/Excel"""
        filepath = os.path.join(DATA_DIR, archivo)
        
        if not os.path.exists(filepath):
            print(f"⚠️ Archivo no encontrado: {archivo}")
            return False
        
        try:
            # Intentar leer CSV
            if archivo.endswith('.csv'):
                df = pd.read_csv(filepath)
            elif archivo.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(filepath)
            else:
                print(f"❌ Formato no soportado: {archivo}")
                return False
            
            print(f"✅ Datos cargados: {len(df)} registros")
            
            # Procesar datos
            self._procesar_cuentas(df)
            return True
            
        except Exception as e:
            print(f"❌ Error al cargar datos: {e}")
            return False
    
    def _procesar_cuentas(self, df):
        """Procesar cuentas en activos, pasivos y patrimonio"""
        
        # Asumiendo columnas: tipo, cuenta, monto
        for _, row in df.iterrows():
            tipo = row.get('tipo', '').lower()
            cuenta = row.get('cuenta', 'Sin nombre')
            monto = float(row.get('monto', 0))
            
            if 'activo' in tipo:
                self.activos[cuenta] = monto
            elif 'pasivo' in tipo:
                self.pasivos[cuenta] = monto
            elif 'patrimonio' in tipo or 'capital' in tipo:
                self.patrimonio[cuenta] = monto
    
    def calcular_totales(self):
        """Calcular totales"""
        total_activos = sum(self.activos.values())
        total_pasivos = sum(self.pasivos.values())
        total_patrimonio = sum(self.patrimonio.values())
        
        return {
            'total_activos': total_activos,
            'total_pasivos': total_pasivos,
            'total_patrimonio': total_patrimonio,
            'balance': total_activos - (total_pasivos + total_patrimonio)
        }
    
    def generar_balance(self):
        """Generar balance general"""
        
        totales = self.calcular_totales()
        
        print("\n" + "="*50)
        print("BALANCE GENERAL")
        print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print("="*50)
        
        print("\nACTIVOS:")
        for cuenta, monto in self.activos.items():
            print(f"  {cuenta:<30} ${monto:>12,.2f}")
        print(f"  {'TOTAL ACTIVOS':<30} ${totales['total_activos']:>12,.2f}")
        
        print("\nPASIVOS:")
        for cuenta, monto in self.pasivos.items():
            print(f"  {cuenta:<30} ${monto:>12,.2f}")
        print(f"  {'TOTAL PASIVOS':<30} ${totales['total_pasivos']:>12,.2f}")
        
        print("\nPATRIMONIO:")
        for cuenta, monto in self.patrimonio.items():
            print(f"  {cuenta:<30} ${monto:>12,.2f}")
        print(f"  {'TOTAL PATRIMONIO':<30} ${totales['total_patrimonio']:>12,.2f}")
        
        print("\n" + "-"*50)
        print(f"  {'BALANCE':<30} ${totales['balance']:>12,.2f}")
        print("="*50)
        
        # Verificar ecuación contable
        if abs(totales['balance']) < 0.01:
            print("✅ Balance cuadrado (Activos = Pasivos + Patrimonio)")
        else:
            print("⚠️ Balance descuadrado!")
        
        return totales
    
    def exportar_excel(self, filename='balance_general.xlsx'):
        """Exportar balance a Excel"""
        
        os.makedirs(RESULTS_DIR, exist_ok=True)
        filepath = os.path.join(RESULTS_DIR, filename)
        
        try:
            # Crear DataFrames
            df_activos = pd.DataFrame(list(self.activos.items()), columns=['Cuenta', 'Monto'])
            df_activos['Tipo'] = 'Activo'
            
            df_pasivos = pd.DataFrame(list(self.pasivos.items()), columns=['Cuenta', 'Monto'])
            df_pasivos['Tipo'] = 'Pasivo'
            
            df_patrimonio = pd.DataFrame(list(self.patrimonio.items()), columns=['Cuenta', 'Monto'])
            df_patrimonio['Tipo'] = 'Patrimonio'
            
            # Combinar
            df_balance = pd.concat([df_activos, df_pasivos, df_patrimonio], ignore_index=True)
            
            # Exportar
            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                df_balance.to_excel(writer, sheet_name='Balance General', index=False)
                
                # Totales
                totales = self.calcular_totales()
                df_totales = pd.DataFrame([totales])
                df_totales.to_excel(writer, sheet_name='Totales', index=False)
            
            print(f"✅ Balance exportado: {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Error al exportar: {e}")
            return False

def main():
    print("🔧 Generando Balance General...")
    
    balance = BalanceGeneral()
    
    # Buscar archivo de datos
    archivos_posibles = ['cuentas.csv', 'cuentas.xlsx', 'datos.csv', 'datos.xlsx']
    
    archivo_encontrado = None
    for archivo in archivos_posibles:
        if os.path.exists(os.path.join(DATA_DIR, archivo)):
            archivo_encontrado = archivo
            break
    
    if not archivo_encontrado:
        print("⚠️ No se encontraron archivos de datos")
        print(f"Buscando en: {DATA_DIR}")
        print(f"Archivos esperados: {archivos_posibles}")
        
        # Crear ejemplo
        crear_datos_ejemplo()
        archivo_encontrado = 'cuentas.csv'
    
    # Cargar y procesar
    if balance.cargar_datos(archivo_encontrado):
        balance.generar_balance()
        balance.exportar_excel()

def crear_datos_ejemplo():
    """Crear datos de ejemplo si no existen"""
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    datos_ejemplo = {
        'tipo': ['Activo', 'Activo', 'Activo', 'Pasivo', 'Pasivo', 'Patrimonio'],
        'cuenta': ['Caja', 'Bancos', 'Cuentas por Cobrar', 'Proveedores', 'Préstamos', 'Capital Social'],
        'monto': [10000, 50000, 30000, 15000, 25000, 50000]
    }
    
    df = pd.DataFrame(datos_ejemplo)
    filepath = os.path.join(DATA_DIR, 'cuentas.csv')
    df.to_csv(filepath, index=False)
    
    print(f"✅ Datos de ejemplo creados: {filepath}")

if __name__ == '__main__':
    main()
