#!/bin/bash

echo "🧪 TEST: Creación de Empresa en Viny2030"
echo "========================================"
echo ""

# Datos de la empresa de prueba
NOMBRE="Empresa Test $(date +%H%M)"
EMAIL="test-$(date +%s)@viny2030.com.ar"
TELEFONO="+54 11 1234-5678"

echo "📋 Datos de la empresa:"
echo "  Nombre: $NOMBRE"
echo "  Email: $EMAIL"
echo "  Teléfono: $TELEFONO"
echo ""

echo "📡 Enviando request a API..."
echo ""

# Llamar al endpoint
RESPONSE=$(curl -s -X POST https://viny2030-com-ar.onrender.com/api/crear-empresa \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"$NOMBRE\",
    \"email\": \"$EMAIL\",
    \"telefono\": \"$TELEFONO\"
  }")

echo "📥 Respuesta del servidor:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extraer API key si existe
API_KEY=$(echo "$RESPONSE" | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$API_KEY" ]; then
    echo "✅ Empresa creada exitosamente!"
    echo ""
    echo "🔑 API Key generada: $API_KEY"
    echo ""
    echo "📂 Próximos pasos:"
    echo "  1. Verificar repositorio en GitHub"
    echo "  2. Probar subida de archivo con:"
    echo ""
    echo "     curl -X POST https://viny2030-com-ar.onrender.com/api/subir-archivo \\"
    echo "       -H \"X-API-Key: $API_KEY\" \\"
    echo "       -F \"archivo=@tu_archivo.pdf\" \\"
    echo "       -F \"categoria=activos_corrientes\""
    echo ""
else
    echo "❌ Error al crear empresa"
    echo ""
fi
