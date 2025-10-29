# 🔧 SOLUCIÓN PASO A PASO - Google Drive API

## 📋 INSTRUCCIONES DETALLADAS:

### PASO 1: Crear Proyecto en Google Cloud
1. Ve a: https://console.cloud.google.com/
2. Haz clic en el menú desplegable del proyecto (arriba a la izquierda)
3. Haz clic en "NUEVO PROYECTO"
4. Nombre del proyecto: "RetoFitness"
5. Haz clic en "CREAR"
6. Espera a que se cree (aparecerá una notificación)
7. Selecciona el proyecto recién creado

### PASO 2: Habilitar APIs
1. En el menú lateral izquierdo, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Drive API" y haz clic en el resultado
3. Haz clic en "HABILITAR"
4. Regresa a "Biblioteca"
5. Busca "Google Picker API" y haz clic en el resultado
6. Haz clic en "HABILITAR"

### PASO 3: Crear API Key
1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "+ CREAR CREDENCIALES"
3. Selecciona "Clave de API"
4. Se creará una clave, CÓPIALA y guárdala temporalmente
5. Haz clic en "RESTRINGIR CLAVE" (opcional pero recomendado)
6. En "Restricciones de API", selecciona "Restringir clave"
7. Marca: "Google Drive API" y "Google Picker API"
8. Haz clic en "GUARDAR"

### PASO 4: Crear OAuth 2.0 Client ID
1. En la misma página de "Credenciales"
2. Haz clic en "+ CREAR CREDENCIALES"
3. Selecciona "ID de cliente de OAuth 2.0"
4. Si te pide configurar pantalla de consentimiento:
   - Haz clic en "CONFIGURAR PANTALLA DE CONSENTIMIENTO"
   - Selecciona "Externo"
   - Llena los campos obligatorios:
     - Nombre de la aplicación: "RetoFitness"
     - Correo electrónico del usuario: tu email
     - Correo electrónico del desarrollador: tu email
   - Haz clic en "GUARDAR Y CONTINUAR"
   - En "Alcances", haz clic en "GUARDAR Y CONTINUAR"
   - En "Usuarios de prueba", haz clic en "GUARDAR Y CONTINUAR"
5. Regresa a crear el ID de cliente OAuth 2.0:
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "RetoFitness Web Client"
   - Orígenes autorizados de JavaScript:
     ```
     http://localhost:8100
     http://localhost:8101
     ```
   - Haz clic en "CREAR"
6. Se creará el Client ID, CÓPIALO y guárdalo

### PASO 5: Actualizar tu código
Ahora tendrás dos valores:
- API_KEY: AIzaSyABC123... (ejemplo)
- CLIENT_ID: 123456789-abc123.apps.googleusercontent.com (ejemplo)

IMPORTANTE: Los valores reales serán diferentes y únicos para ti.

### PASO 6: Aplicar en tu código
Una vez que tengas tus credenciales reales, me las pasas y yo las configuro en tu código.

---

🎯 **Después de seguir estos pasos, tendrás:**
- ✅ Proyecto de Google Cloud configurado
- ✅ APIs habilitadas
- ✅ Credenciales listas para usar
- ✅ Error 400 solucionado

💡 **Tip:** Todo este proceso toma unos 5-10 minutos la primera vez.