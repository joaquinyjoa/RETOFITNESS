# 📸 Guía de Screenshots para el README

## 📋 Screenshots Necesarias

Coloca aquí las capturas de pantalla de tu app con los siguientes nombres:

### 🔐 Autenticación
- `login.png` - Pantalla de login
- `registro.png` - Pantalla de registro (opcional)

### 📊 Dashboards
- `dashboard.png` - Dashboard principal (cualquier rol)
- `panel-admin.png` - Vista del panel de administrador
- `panel-entrenador.png` - Vista del panel de entrenador
- `panel-cliente.png` - Vista del panel de cliente

### 💪 Funcionalidades
- `rutinas.png` - Lista de rutinas o creación de rutina
- `ejercicios.png` - Biblioteca de ejercicios
- `asignar-rutina.png` - Pantalla de asignación de rutinas
- `detalle-rutina.png` - Vista detallada de una rutina

### 👥 Gestión
- `clientes.png` - Lista de clientes
- `recepcion.png` - Panel de recepción/aprobación

## 📐 Especificaciones

### Tamaño Recomendado
- **Ancho**: 1080px (resolución móvil)
- **Alto**: 1920px o proporción 9:16
- **Formato**: PNG o JPG
- **Peso**: < 500KB por imagen

### Cómo Tomar Screenshots en Android

#### Método 1: Dispositivo Físico
1. Presiona **Volumen Abajo + Power** simultáneamente
2. Las imágenes se guardan en `Pictures/Screenshots`

#### Método 2: Android Studio
1. Abre tu app en el emulador
2. Click en 📷 (icono cámara) en la barra lateral derecha
3. Guardar en la carpeta `screenshots/`

#### Método 3: Chrome DevTools (Web)
1. Abre la app en Chrome
2. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
3. Selecciona "iPhone 12 Pro" o "Samsung Galaxy S20"
4. Click derecho → "Capture screenshot"

## 🎨 Tips para Mejores Screenshots

### 1. **Usar Datos de Ejemplo Realistas**
```
❌ "Test User 1"
✅ "Carlos Ramírez"

❌ "Rutina 123"
✅ "Rutina Hipertrofia Piernas"
```

### 2. **Llenar con Contenido**
- Muestra al menos 3-5 elementos en listas
- Evita pantallas vacías o con "No hay datos"

### 3. **Modo Claro Consistente**
- Usa siempre modo claro o siempre modo oscuro
- No mezcles ambos en el README

### 4. **Ocultar Información Sensible**
- Blurrea emails reales
- Usa números de teléfono falsos
- No muestres URLs de producción con tokens

### 5. **Estado de la App**
```
✅ Mostrar: Rutinas asignadas, ejercicios con imágenes
❌ Evitar: Spinners de carga, errores, pantallas en blanco
```

## 🎥 Videos para el README

### Plataformas Recomendadas

#### YouTube (Recomendado)
1. Graba tu pantalla con:
   - Windows: **Win + G** (Xbox Game Bar)
   - Android: **Grabación de pantalla nativa**
2. Sube a YouTube (puede ser "No listado" si no quieres que sea público)
3. Copia el ID del video de la URL: `https://www.youtube.com/watch?v=ABC123DEF` → `ABC123DEF`
4. Reemplaza en el README:
```markdown
[![Demo Video](https://img.youtube.com/vi/ABC123DEF/maxresdefault.jpg)](https://www.youtube.com/watch?v=ABC123DEF)
```

#### Loom (Alternativa)
1. Instala [Loom Desktop](https://www.loom.com/download)
2. Graba tu pantalla
3. Obtén el link compartible
4. Agrega al README:
```markdown
🎬 [Ver demo en Loom](https://www.loom.com/share/tu-video-id)
```

#### Alternativa: GIFs
Si no quieres videos largos, crea GIFs de 10-30 segundos:

1. Graba con **ScreenToGif** (Windows)
2. Edita y optimiza (reducir FPS a 15-20)
3. Guarda en `screenshots/demo.gif`
4. Usa en el README:
```markdown
<img src="screenshots/demo.gif" alt="Demo" width="300"/>
```

## 📱 Demo Sugerido por Video

### Video 1: Entrenador (2-3 min)
1. Login como entrenador
2. Ver dashboard con estadísticas
3. Crear nueva rutina
4. Agregar ejercicios con GIFs
5. Asignar rutina a cliente

### Video 2: Cliente (1-2 min)
1. Login como cliente
2. Ver rutina del día
3. Reproducir GIF de ejercicio
4. Marcar ejercicio como completado

### Video 3: Admin (1 min)
1. Login como admin
2. Aprobar usuario pendiente
3. Ver estadísticas globales

## 🖼️ Formato Final Esperado

Después de agregar las imágenes, el README mostrará:

```markdown
<div align="center">
  <img src="screenshots/login.png" alt="Login" width="250"/>
  <img src="screenshots/dashboard.png" alt="Dashboard" width="250"/>
  <img src="screenshots/rutinas.png" alt="Rutinas" width="250"/>
</div>
```

## ✅ Checklist

Marca cuando completes:

- [ ] `login.png` agregado
- [ ] `dashboard.png` agregado
- [ ] `rutinas.png` agregado
- [ ] `ejercicios.png` agregado
- [ ] `clientes.png` agregado
- [ ] `panel-cliente.png` agregado
- [ ] Video demo subido a YouTube
- [ ] ID del video reemplazado en README
- [ ] Información personal blureada
- [ ] Tamaños de imagen optimizados (<500KB)

---

## 🚀 Comando Rápido para Optimizar Imágenes

Si tus imágenes son muy pesadas:

### Windows (usando TinyPNG web)
1. Visita [tinypng.com](https://tinypng.com)
2. Arrastra tus PNGs
3. Descarga las versiones comprimidas

### Linux/macOS (usando ImageMagick)
```bash
# Instalar
sudo apt install imagemagick  # Ubuntu
brew install imagemagick       # macOS

# Comprimir todas las PNGs
mogrify -resize 1080x1920 -quality 85 *.png
```

---

**¿Dudas?** Revisa ejemplos en [awesome-readme](https://github.com/matiassingers/awesome-readme)
