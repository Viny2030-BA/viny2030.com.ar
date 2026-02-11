#!/usr/bin/env python3
"""
ratios_financieros.py - Calcular Ratios Financieros
Analiza liquidez, rentabilidad, endeudamiento, etc.
"""

import os
import pandas as pd
from datetime import datetime
from config import DATA_DIR, RESULTS_DIR

class RatiosFinancieros:
    def __init__(self):
        self.datos = {}
        
    def cargar_datos(self, archivo='cuentas.csv'):
        """Cargar datos contables"""
        filepath = os.path.join(DATA_DIR, archivo)
        
        if not os.path.exists(filepath):
            print(f"⚠️ Archivo no encontrado: {archivo}")
            return False
        
        try:
            if archivo.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Extraer valores necesarios
            self._extraer_valores(df)
            return True
            
        except Exception as e:
            print(f"❌ Error al cargar datos: {e}")
            return False
    
    def _extraer_valores(self, df):
        """Extraer valores clave del DataFrame"""
        
        # Activos
        self.datos['activo_corriente'] = df[df['tipo'].str.contains('activo corriente', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        self.datos['activo_total'] = df[df['tipo'].str.contains('activo', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        
        # Pasivos
        self.datos['pasivo_corriente'] = df[df['tipo'].str.contains('pasivo corriente', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        self.datos['pasivo_total'] = df[df['tipo'].str.contains('pasivo', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        
        # Patrimonio
        self.datos['patrimonio'] = df[df['tipo'].str.contains('patrimonio|capital', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        
        # Resultados (si están disponibles)
        self.datos['ventas'] = df[df['tipo'].str.contains('ventas|ingresos', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        self.datos['utilidad_neta'] = df[df['tipo'].str.contains('utilidad|ganancia', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        self.datos['costo_ventas'] = df[df['tipo'].str.contains('costo', case=False, na=False)]['monto'].sum() if 'tipo' in df.columns else 0
        
        # Inventario y cuentas
        self.datos['inventario'] = df[df['cuenta'].str.contains('inventario', case=False, na=False)]['monto'].sum() if 'cuenta' in df.columns else 0
        self.datos['cuentas_cobrar'] = df[df['cuenta'].str.contains('cobrar|clientes', case=False, na=False)]['monto'].sum() if 'cuenta' in df.columns else 0
        self.datos['cuentas_pagar'] = df[df['cuenta'].str.contains('pagar|proveedores', case=False, na=False)]['monto'].sum() if 'cuenta' in df.columns else 0
    
    def ratio_liquidez_corriente(self):
        """Ratio de Liquidez Corriente = Activo Corriente / Pasivo Corriente"""
        if self.datos['pasivo_corriente'] == 0:
            return 0
        return self.datos['activo_corriente'] / self.datos['pasivo_corriente']
    
    def ratio_prueba_acida(self):
        """Prueba Ácida = (Activo Corriente - Inventario) / Pasivo Corriente"""
        if self.datos['pasivo_corriente'] == 0:
            return 0
        return (self.datos['activo_corriente'] - self.datos['inventario']) / self.datos['pasivo_corriente']
    
    def ratio_endeudamiento(self):
        """Ratio de Endeudamiento = Pasivo Total / Activo Total"""
        if self.datos['activo_total'] == 0:
            return 0
        return self.datos['pasivo_total'] / self.datos['activo_total']
    
    def ratio_apalancamiento(self):
        """Ratio de Apalancamiento = Pasivo Total / Patrimonio"""
        if self.datos['patrimonio'] == 0:
            return 0
        return self.datos['pasivo_total'] / self.datos['patrimonio']
    
    def ratio_rentabilidad_patrimonio(self):
        """ROE = Utilidad Neta / Patrimonio"""
        if self.datos['patrimonio'] == 0:
            return 0
        return self.datos['utilidad_neta'] / self.datos['patrimonio']
    
    def ratio_rentabilidad_activos(self):
        """ROA = Utilidad Neta / Activo Total"""
        if self.datos['activo_total'] == 0:
            return 0
        return self.datos['utilidad_neta'] / self.datos['activo_total']
    
    def margen_utilidad(self):
        """Margen de Utilidad = Utilidad Neta / Ventas"""
        if self.datos['ventas'] == 0:
            return 0
        return self.datos['utilidad_neta'] / self.datos['ventas']
    
    def rotacion_inventario(self):
        """Rotación de Inventario = Costo de Ventas / Inventario Promedio"""
        if self.datos['inventario'] == 0:
            return 0
        return self.datos['costo_ventas'] / self.datos['inventario']
    
    def calcular_todos(self):
        """Calcular todos los ratios"""
        
        ratios = {
            'Liquidez Corriente': self.ratio_liquidez_corriente(),
            'Prueba Ácida': self.ratio_prueba_acida(),
            'Endeudamiento': self.ratio_endeudamiento(),
            'Apalancamiento': self.ratio_apalancamiento(),
            'ROE (%)': self.ratio_rentabilidad_patrimonio() * 100,
            'ROA (%)': self.ratio_rentabilidad_activos() * 100,
            'Margen Utilidad (%)': self.margen_utilidad() * 100,
            'Rotación Inventario': self.rotacion_inventario()
        }
        
        return ratios
    
    def interpretar_ratio(self, nombre, valor):
        """Interpretar ratio y dar recomendación"""
        
        interpretaciones = {
            'Liquidez Corriente': {
                'optimo': (1.5, 2.5),
                'bajo': 'Problemas de liquidez',
                'alto': 'Exceso de activos ociosos',
                'ideal': 'Liquidez saludable'
            },
            'Prueba Ácida': {
                'optimo': (1.0, 1.5),
                'bajo': 'Dependencia del inventario',
                'alto': 'Buena capacidad de pago inmediato',
                'ideal': 'Liquidez inmediata adecuada'
            },
            'Endeudamiento': {
                'optimo': (0.3, 0.6),
                'bajo': 'Poco apalancamiento',
                'alto': 'Alto riesgo financiero',
                'ideal': 'Nivel de deuda manejable'
            }
        }
        
        if nombre in interpretaciones:
            config = interpretaciones[nombre]
            optimo = config['optimo']
            
            if valor < optimo[0]:
                return config['bajo']
            elif valor > optimo[1]:
                return config['alto']
            else:
                return config['ideal']
        
        return 'N/A'
    
    def generar_reporte(self):
        """Generar reporte de ratios"""
        
        ratios = self.calcular_todos()
        
        print("\n" + "="*60)
        print("RATIOS FINANCIEROS")
        print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print("="*60)
        
        print("\n📊 RATIOS DE LIQUIDEZ")
        print(f"  Liquidez Corriente:     {ratios['Liquidez Corriente']:>8.2f}")
        print(f"    → {self.interpretar_ratio('Liquidez Corriente', ratios['Liquidez Corriente'])}")
        print(f"  Prueba Ácida:           {ratios['Prueba Ácida']:>8.2f}")
        print(f"    → {self.interpretar_ratio('Prueba Ácida', ratios['Prueba Ácida'])}")
        
        print("\n💰 RATIOS DE ENDEUDAMIENTO")
        print(f"  Endeudamiento:          {ratios['Endeudamiento']:>8.2%}")
        print(f"    → {self.interpretar_ratio('Endeudamiento', ratios['Endeudamiento'])}")
        print(f"  Apalancamiento:         {ratios['Apalancamiento']:>8.2f}")
        
        print("\n📈 RATIOS DE RENTABILIDAD")
        print(f"  ROE:                    {ratios['ROE (%)']:>8.2f}%")
        print(f"  ROA:                    {ratios['ROA (%)']:>8.2f}%")
        print(f"  Margen de Utilidad:     {ratios['Margen Utilidad (%)']:>8.2f}%")
        
        print("\n🔄 RATIOS DE EFICIENCIA")
        print(f"  Rotación Inventario:    {ratios['Rotación Inventario']:>8.2f}")
        
        print("="*60)
        
        return ratios
    
    def exportar_excel(self, filename='ratios_financieros.xlsx'):
        """Exportar ratios a Excel"""
        
        os.makedirs(RESULTS_DIR, exist_ok=True)
        filepath = os.path.join(RESULTS_DIR, filename)
        
        try:
            ratios = self.calcular_todos()
            
            df_ratios = pd.DataFrame([ratios])
            df_ratios = df_ratios.T
            df_ratios.columns = ['Valor']
            
            df_ratios.to_excel(filepath)
            
            print(f"✅ Ratios exportados: {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Error al exportar: {e}")
            return False

def main():
    print("🔧 Calculando Ratios Financieros...")
    
    ratios = RatiosFinancieros()
    
    if ratios.cargar_datos('cuentas.csv'):
        ratios.generar_reporte()
        ratios.exportar_excel()

if __name__ == '__main__':
    main()
