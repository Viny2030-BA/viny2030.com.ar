"""
🍷 Viny 2030 — Algoritmo de Gestión de Inventario
Cliente: VNY-2026-0009
Dataset: inventario_materia_prima.csv

Ejecutar:
    pip install streamlit pandas plotly
    streamlit run app.py
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from io import StringIO
from datetime import datetime, date

# ─── CONFIGURACIÓN ────────────────────────────────────────
st.set_page_config(
    page_title="Inventario — Viny 2030",
    page_icon="🍷",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main { background-color: #0d1f35; }
    .stMetric { background: #1a3a5c; border-radius: 10px; padding: 10px; border: 1px solid #2a4f72; }
    .stMetric label { color: #7a9ab8 !important; font-size: 11px !important; letter-spacing: 2px; }
    .stMetric .metric-value { color: #c9a84c !important; }
    h1, h2, h3 { color: #c9a84c; }
    .stSidebar { background-color: #152e4a; }
    .alerta-reposicion { background: rgba(233,69,96,0.1); border-left: 4px solid #e94560;
                         padding: 10px 14px; border-radius: 4px; margin-bottom: 8px; }
</style>
""", unsafe_allow_html=True)

# ─── DATOS ────────────────────────────────────────────────
CSV_DATA = """id_material,descripcion,categoria,unidad_medida,cantidad_stock,punto_reposicion,costo_unitario,valor_total,fecha_ultima_entrada,fecha_ultima_salida
MP-1000,Fibra Óptica,Vidrio,kg,761.22,28.15,211.88,161287.29,2025-03-14,2025-03-24
MP-1001,Tela de Algodón,Plásticos,m3,111.19,60.09,180.13,20028.65,2025-02-08,2025-03-19
MP-1002,Cable de Cobre,Químicos,kg,732.43,82.75,486.58,356385.79,2025-01-22,2025-01-28
MP-1003,Disolvente Orgánico,Madera,m3,831.11,94.69,430.99,358200.1,2024-10-12,2024-10-25
MP-1004,Polipropileno,Papel,kg,55.37,38.05,145.4,8050.8,2025-06-24,2025-08-18
MP-1005,Chapa de Acero,Plásticos,kg,386.32,70.74,417.22,161180.43,2025-05-12,2025-06-05
MP-1006,Seda Natural,Químicos,litros,673.47,106.76,342.09,230387.35,2025-06-28,2025-08-06
MP-1007,Madera de Cedro,Papel,litros,538.8,40.5,231.67,124823.8,2025-03-18,2025-05-17
MP-1008,Plomo Puro,Papel,metros,561.38,104.27,421.58,236666.58,2025-07-06,2025-07-21
MP-1009,Lana Sintética,Vidrio,kg,807.0,63.17,34.03,27462.21,2024-10-17,2024-12-13
MP-1010,Cloruro de Calcio,Papel,m3,220.5,77.39,442.46,97562.43,2024-09-08,2024-10-08
MP-1011,Aglomerado MDF,Plásticos,m3,148.23,113.02,269.95,40014.69,2024-10-08,2024-11-05
MP-1012,Botella PET,Madera,unidades,368.38,149.61,70.03,25797.65,2024-11-24,2024-11-30
MP-1013,Resina Epoxi,Vidrio,kg,862.49,27.16,80.83,69715.07,2024-12-30,2025-02-07
MP-1014,Cristal de Cuarzo,Metales,unidades,387.8,149.44,265.03,102778.63,2024-10-24,2024-12-19
MP-1015,Ácido Nítrico,Metales,metros,723.51,103.85,268.95,194588.01,2025-03-20,2025-05-09
MP-1016,Bronce Fundido,Papel,m3,120.44,68.04,227.41,27389.26,2025-03-22,2025-04-24
MP-1017,Espuma de Poliestireno,Vidrio,litros,512.6,20.43,313.02,160454.05,2024-09-10,2024-10-13
MP-1018,Abeto Seco,Madera,litros,161.31,115.56,270.15,43577.9,2024-11-05,2025-01-03
MP-1019,Sulfato de Amonio,Metales,rollos,330.91,7.82,464.62,153747.4,2025-02-27,2025-03-15
MP-1020,PVC Flexible,Metales,litros,879.23,142.31,43.74,38457.52,2024-11-28,2025-01-20
MP-1021,Roble Blanco,Metales,rollos,768.18,23.62,238.17,182957.43,2024-10-26,2024-11-06
MP-1022,Cartón Prensado,Químicos,rollos,873.71,66.36,106.69,93216.12,2024-10-31,2024-12-19
MP-1023,Papel Reciclado,Papel,metros,209.14,50.2,497.58,104063.88,2024-09-05,2024-09-29
MP-1024,Vidrio Templado,Textiles,rollos,456.97,40.95,32.95,15057.16,2025-07-24,2025-08-31
MP-1025,Nylon Grado Industrial,Madera,litros,592.56,6.04,354.21,209890.68,2025-07-04,2025-07-19
MP-1026,Film de Embalaje,Metales,kg,861.04,15.27,119.76,103118.15,2024-11-28,2024-12-12
MP-1027,Hilo de Poliéster,Madera,litros,726.12,132.95,288.53,209507.4,2025-04-01,2025-05-22
MP-1028,Aluminio Extruido,Textiles,unidades,198.51,19.05,216.09,42896.03,2024-12-30,2025-01-26
MP-1029,Pulpa de Celulosa,Textiles,metros,63.63,99.75,323.44,20580.49,2025-07-03,2025-07-29"""

@st.cache_data
def cargar_datos():
    df = pd.read_csv(StringIO(CSV_DATA))
    df['fecha_ultima_entrada'] = pd.to_datetime(df['fecha_ultima_entrada'])
    df['fecha_ultima_salida']  = pd.to_datetime(df['fecha_ultima_salida'])
    df['dias_sin_movimiento']  = (datetime.now() - df['fecha_ultima_salida']).dt.days
    df['estado_stock'] = df.apply(
        lambda r: '🔴 Crítico' if r['cantidad_stock'] <= r['punto_reposicion']
                  else ('🟡 Bajo' if r['cantidad_stock'] <= r['punto_reposicion'] * 1.5
                        else '🟢 Normal'), axis=1
    )
    df['margen_seguridad'] = ((df['cantidad_stock'] - df['punto_reposicion']) / df['punto_reposicion'] * 100).round(1)
    return df

df = cargar_datos()

# ─── SIDEBAR ──────────────────────────────────────────────
st.sidebar.markdown("## 🍷 Viny 2030")
st.sidebar.markdown("**Gestión de Inventario**")
st.sidebar.markdown("---")

categorias = ["Todas"] + sorted(df['categoria'].unique().tolist())
cat_sel = st.sidebar.selectbox("📂 Categoría", categorias)

estados = ["Todos", "🔴 Crítico", "🟡 Bajo", "🟢 Normal"]
estado_sel = st.sidebar.selectbox("📊 Estado de Stock", estados)

fecha_min = df['fecha_ultima_salida'].min().date()
fecha_max = df['fecha_ultima_salida'].max().date()
fecha_rango = st.sidebar.date_input(
    "📅 Rango última salida",
    value=(fecha_min, fecha_max),
    min_value=fecha_min,
    max_value=fecha_max
)

# Aplicar filtros
df_f = df.copy()
if cat_sel != "Todas":
    df_f = df_f[df_f['categoria'] == cat_sel]
if estado_sel != "Todos":
    df_f = df_f[df_f['estado_stock'] == estado_sel]
if len(fecha_rango) == 2:
    df_f = df_f[
        (df_f['fecha_ultima_salida'].dt.date >= fecha_rango[0]) &
        (df_f['fecha_ultima_salida'].dt.date <= fecha_rango[1])
    ]

st.sidebar.markdown("---")
st.sidebar.markdown(f"**Mostrando:** {len(df_f)} / {len(df)} materiales")

# ─── HEADER ───────────────────────────────────────────────
st.title("📦 Inventario de Materia Prima")
st.markdown(f"*Datos al {datetime.now().strftime('%d/%m/%Y')} — VNY-2026-0009*")

# ─── KPIs ─────────────────────────────────────────────────
col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Total materiales", len(df_f))
col2.metric("Valor total stock", f"${df_f['valor_total'].sum():,.0f}")
col3.metric("🔴 Críticos", len(df_f[df_f['estado_stock']=='🔴 Crítico']))
col4.metric("🟡 Stock bajo", len(df_f[df_f['estado_stock']=='🟡 Bajo']))
col5.metric("Costo promedio", f"${df_f['costo_unitario'].mean():,.2f}")

st.markdown("---")

# ─── TABS ─────────────────────────────────────────────────
tab1, tab2, tab3, tab4 = st.tabs([
    "📊 Dashboard", "🔴 Alertas de Reposición", "📈 Análisis por Categoría", "📋 Tabla Completa"
])

# ── TAB 1: DASHBOARD ──────────────────────────────────────
with tab1:
    col_a, col_b = st.columns(2)

    with col_a:
        st.subheader("Distribución de Stock por Estado")
        conteo_estado = df_f['estado_stock'].value_counts().reset_index()
        conteo_estado.columns = ['Estado', 'Cantidad']
        fig_pie = px.pie(
            conteo_estado, values='Cantidad', names='Estado',
            color='Estado',
            color_discrete_map={'🔴 Crítico':'#e94560','🟡 Bajo':'#c9a84c','🟢 Normal':'#6bc96b'},
            hole=0.4
        )
        fig_pie.update_layout(
            paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
            font_color='#e8e0d0', legend=dict(font=dict(color='#e8e0d0'))
        )
        st.plotly_chart(fig_pie, use_container_width=True)

    with col_b:
        st.subheader("Top 10 por Valor Total de Stock")
        top10 = df_f.nlargest(10, 'valor_total')[['descripcion','valor_total','estado_stock']]
        fig_bar = px.bar(
            top10, x='valor_total', y='descripcion', orientation='h',
            color='estado_stock',
            color_discrete_map={'🔴 Crítico':'#e94560','🟡 Bajo':'#c9a84c','🟢 Normal':'#6bc96b'},
            labels={'valor_total':'Valor ($)', 'descripcion':'Material'}
        )
        fig_bar.update_layout(
            paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
            font_color='#e8e0d0', yaxis={'categoryorder':'total ascending'},
            showlegend=False
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    st.subheader("Stock vs Punto de Reposición")
    fig_scatter = px.scatter(
        df_f, x='punto_reposicion', y='cantidad_stock',
        size='valor_total', color='estado_stock', hover_name='descripcion',
        hover_data=['categoria','costo_unitario'],
        color_discrete_map={'🔴 Crítico':'#e94560','🟡 Bajo':'#c9a84c','🟢 Normal':'#6bc96b'},
        labels={'punto_reposicion':'Punto de Reposición','cantidad_stock':'Cantidad en Stock'}
    )
    # Línea diagonal: stock = punto_reposicion
    max_val = max(df_f['punto_reposicion'].max(), df_f['cantidad_stock'].max())
    fig_scatter.add_trace(go.Scatter(
        x=[0, max_val], y=[0, max_val],
        mode='lines', line=dict(color='#e94560', dash='dash', width=1),
        name='Límite crítico', showlegend=True
    ))
    fig_scatter.update_layout(
        paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(13,31,53,0.6)',
        font_color='#e8e0d0'
    )
    st.plotly_chart(fig_scatter, use_container_width=True)

# ── TAB 2: ALERTAS ────────────────────────────────────────
with tab2:
    criticos = df_f[df_f['estado_stock'] == '🔴 Crítico'].sort_values('margen_seguridad')
    bajos    = df_f[df_f['estado_stock'] == '🟡 Bajo'].sort_values('margen_seguridad')

    if len(criticos) > 0:
        st.error(f"⚠️ {len(criticos)} materiales en estado CRÍTICO — requieren reposición inmediata")
        for _, r in criticos.iterrows():
            deficit = r['punto_reposicion'] - r['cantidad_stock']
            st.markdown(f"""
            <div class="alerta-reposicion">
                <b>{r['descripcion']}</b> ({r['id_material']}) — {r['categoria']}<br>
                Stock actual: <b>{r['cantidad_stock']} {r['unidad_medida']}</b> |
                Punto reposición: <b>{r['punto_reposicion']}</b> |
                Déficit: <b style="color:#e94560">{deficit:.1f} {r['unidad_medida']}</b><br>
                Costo reposición estimado: <b>${deficit * r['costo_unitario']:,.2f}</b>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.success("✅ No hay materiales en estado crítico con los filtros actuales.")

    if len(bajos) > 0:
        st.warning(f"🟡 {len(bajos)} materiales con stock bajo — monitorear")
        cols = ['id_material','descripcion','categoria','cantidad_stock','punto_reposicion','margen_seguridad','costo_unitario']
        st.dataframe(
            bajos[cols].style.format({'cantidad_stock':'{:.2f}','punto_reposicion':'{:.2f}',
                                      'margen_seguridad':'{:.1f}%','costo_unitario':'${:.2f}'}),
            use_container_width=True
        )

    st.subheader("📅 Materiales sin movimiento (días desde última salida)")
    sin_mov = df_f.nlargest(10, 'dias_sin_movimiento')[
        ['descripcion','categoria','dias_sin_movimiento','cantidad_stock','valor_total']
    ]
    fig_mov = px.bar(
        sin_mov, x='dias_sin_movimiento', y='descripcion', orientation='h',
        color='dias_sin_movimiento',
        color_continuous_scale=['#6bc96b','#c9a84c','#e94560'],
        labels={'dias_sin_movimiento':'Días sin movimiento','descripcion':'Material'}
    )
    fig_mov.update_layout(
        paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
        font_color='#e8e0d0', yaxis={'categoryorder':'total ascending'}, showlegend=False
    )
    st.plotly_chart(fig_mov, use_container_width=True)

# ── TAB 3: ANÁLISIS POR CATEGORÍA ─────────────────────────
with tab3:
    resumen_cat = df_f.groupby('categoria').agg(
        materiales=('id_material','count'),
        valor_total=('valor_total','sum'),
        stock_promedio=('cantidad_stock','mean'),
        costo_promedio=('costo_unitario','mean'),
        criticos=('estado_stock', lambda x: (x=='🔴 Crítico').sum())
    ).reset_index().sort_values('valor_total', ascending=False)

    col_c, col_d = st.columns(2)
    with col_c:
        st.subheader("Valor por Categoría")
        fig_cat = px.bar(
            resumen_cat, x='categoria', y='valor_total',
            color='criticos', color_continuous_scale=['#6bc96b','#c9a84c','#e94560'],
            labels={'valor_total':'Valor Total ($)','categoria':'Categoría','criticos':'N° Críticos'}
        )
        fig_cat.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color='#e8e0d0')
        st.plotly_chart(fig_cat, use_container_width=True)

    with col_d:
        st.subheader("Composición del Inventario")
        fig_tree = px.treemap(
            df_f, path=['categoria','descripcion'], values='valor_total',
            color='margen_seguridad',
            color_continuous_scale=['#e94560','#c9a84c','#6bc96b'],
            color_continuous_midpoint=50
        )
        fig_tree.update_layout(paper_bgcolor='rgba(0,0,0,0)', font_color='#e8e0d0')
        st.plotly_chart(fig_tree, use_container_width=True)

    st.subheader("Resumen por Categoría")
    st.dataframe(
        resumen_cat.style.format({
            'valor_total':'${:,.0f}', 'stock_promedio':'{:.1f}',
            'costo_promedio':'${:.2f}'
        }).background_gradient(subset=['criticos'], cmap='Reds'),
        use_container_width=True
    )

# ── TAB 4: TABLA COMPLETA ─────────────────────────────────
with tab4:
    st.subheader(f"Inventario completo ({len(df_f)} materiales)")

    buscar = st.text_input("🔍 Buscar material", placeholder="descripcion, id, categoria...")
    if buscar:
        mask = df_f.apply(lambda r: buscar.lower() in str(r).lower(), axis=1)
        df_f = df_f[mask]

    cols_tabla = ['id_material','descripcion','categoria','unidad_medida',
                  'cantidad_stock','punto_reposicion','estado_stock',
                  'margen_seguridad','costo_unitario','valor_total',
                  'fecha_ultima_entrada','fecha_ultima_salida','dias_sin_movimiento']

    st.dataframe(
        df_f[cols_tabla].style.format({
            'cantidad_stock':'{:.2f}', 'punto_reposicion':'{:.2f}',
            'margen_seguridad':'{:.1f}%', 'costo_unitario':'${:.2f}',
            'valor_total':'${:,.2f}', 'dias_sin_movimiento':'{:.0f} días'
        }).applymap(
            lambda v: 'color: #e94560' if v == '🔴 Crítico' else
                      ('color: #c9a84c' if v == '🟡 Bajo' else ''),
            subset=['estado_stock']
        ),
        use_container_width=True, height=500
    )

    # Exportar CSV
    csv_export = df_f[cols_tabla].to_csv(index=False).encode('utf-8')
    st.download_button(
        "⬇️ Descargar CSV filtrado", csv_export,
        file_name=f"inventario_{datetime.now().strftime('%Y%m%d')}.csv",
        mime='text/csv'
    )

# ─── FOOTER ───────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<p style='text-align:center;color:#3a4a5a;font-size:11px;'>"
    "🍷 Viny 2030 — viny2030.com.ar — VNY-2026-0009</p>",
    unsafe_allow_html=True
)
