#!/bin/bash

# 🚀 Script de Configuración Rápida - Google Drive API
# Este script te ayuda a configurar Google Drive API paso a paso

echo "🔧 CONFIGURACIÓN DE GOOGLE DRIVE API PARA RETOFITNESS"
echo "=================================================="
echo ""

echo "📋 PASOS A SEGUIR:"
echo ""
echo "1️⃣  Ve a Google Cloud Console:"
echo "    https://console.cloud.google.com/"
echo ""
echo "2️⃣  Crea un nuevo proyecto llamado 'RetoFitness'"
echo ""
echo "3️⃣  Habilita estas APIs:"
echo "    - Google Drive API"
echo "    - Google Picker API"
echo ""
echo "4️⃣  Crea credenciales:"
echo "    - API Key (para acceso público)"
echo "    - OAuth 2.0 Client ID (para autenticación)"
echo ""
echo "5️⃣  Configura OAuth 2.0:"
echo "    - Tipo: Aplicación web"
echo "    - Orígenes autorizados: http://localhost:8100"
echo ""

echo "💡 Cuando tengas tus credenciales, ejecuta:"
echo "   npm run config:google-drive"
echo ""

echo "🔗 Enlaces útiles:"
echo "   📚 Guía completa: ./CONFIGURAR_GOOGLE_DRIVE.md"
echo "   🌐 Google Cloud Console: https://console.cloud.google.com/"
echo ""

echo "❓ ¿Necesitas ayuda? Revisa los archivos de documentación."
echo ""

# Función para configurar credenciales
configure_credentials() {
    echo "🔑 CONFIGURACIÓN DE CREDENCIALES"
    echo "==============================="
    echo ""
    
    read -p "Ingresa tu CLIENT_ID (debe terminar en .apps.googleusercontent.com): " client_id
    read -p "Ingresa tu API_KEY: " api_key
    
    if [[ $client_id == *".apps.googleusercontent.com" ]] && [[ ! -z "$api_key" ]]; then
        # Actualizar archivo de servicio
        sed -i "s/TU_CLIENT_ID.apps.googleusercontent.com/$client_id/g" src/app/services/google-drive.service.ts
        sed -i "s/TU_API_KEY/$api_key/g" src/app/services/google-drive.service.ts
        
        echo "✅ Credenciales configuradas correctamente!"
        echo "🚀 Reinicia tu servidor con: ionic serve"
    else
        echo "❌ Error: Verifica que las credenciales sean correctas"
        echo "   CLIENT_ID debe terminar en .apps.googleusercontent.com"
        echo "   API_KEY no puede estar vacío"
    fi
}