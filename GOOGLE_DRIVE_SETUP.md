# 🔧 Configuración Rápida de Google Drive API

## ⚡ Solución Inmediata para Error 400

El error 400 que experimentas se debe a que las credenciales de Google API no están configuradas. Aquí tienes la solución paso a paso:

### 🎯 Pasos Rápidos (5 minutos):

#### 1. Ve a Google Cloud Console
🔗 https://console.cloud.google.com/

#### 2. Crea un proyecto nuevo
- Haz clic en "Seleccionar proyecto" → "Proyecto nuevo"
- Nombre: "RetoFitness" (o el que prefieras)
- Haz clic en "Crear"

#### 3. Habilita las APIs necesarias
- Ve a "APIs y servicios" → "Biblioteca"
- Busca y habilita estas 2 APIs:
  - ✅ **Google Drive API**
  - ✅ **Google Picker API**

#### 4. Crear API Key
- Ve a "APIs y servicios" → "Credenciales"
- Haz clic en "Crear credenciales" → "Clave de API"
- Copia la clave que aparece (guárdala temporalmente)

#### 5. Crear Cliente OAuth 2.0
- En la misma página de "Credenciales"
- Haz clic en "Crear credenciales" → "ID de cliente de OAuth 2.0"
- Si te pide configurar pantalla de consentimiento, hazlo rápidamente:
  - Tipo: "Externo"
  - Nombre de la aplicación: "RetoFitness"
  - Email del usuario: tu email
  - Guardar y continuar (deja todo lo demás en blanco)
- Tipo de aplicación: "Aplicación web"
- Orígenes autorizados de JavaScript:
  ```
  http://localhost:8100
  http://localhost:8101
  ```
- Haz clic en "Crear"
- Copia el Client ID que aparece

#### 6. Actualizar las credenciales en tu código
Abre el archivo: `src/app/services/google-drive.service.ts`

Reemplaza estas líneas:
```typescript
private CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'; // ⚠️ CAMBIAR
private API_KEY = 'TU_API_KEY'; // ⚠️ CAMBIAR
```

Por tus credenciales reales:
```typescript
private CLIENT_ID = 'TU_CLIENT_ID_REAL_AQUI.apps.googleusercontent.com';
private API_KEY = 'TU_API_KEY_REAL_AQUI';
```

### 🚀 Listo para probar!

Una vez que actualices las credenciales:
1. Reinicia tu servidor (`ionic serve`)
2. Ve a ver-ejercicios
3. Haz clic en "Seleccionar desde Google Drive"
4. Debería funcionar sin errores

### 🔧 Si aún tienes problemas:

**Usar opción temporal:**
- Haz clic en "Usar URL manual (temporal)"
- Pega una URL de Google Drive existente
- Formato: `https://drive.google.com/file/d/ARCHIVO_ID/view`

**Verificar configuración:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes de error específicos
4. Los mensajes te dirán exactamente qué está mal

### 📧 URLs de ejemplo para pruebas:
```
https://drive.google.com/file/d/1ABC123/view
https://drive.google.com/file/d/1XYZ789/preview
```

---
⚠️ **Importante:** No subas las credenciales reales al repositorio público. Para producción usa variables de entorno.