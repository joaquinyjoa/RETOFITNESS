# Sistema de Rutinas - RetoFitness

## 📋 Resumen

Se ha implementado un sistema completo de gestión de rutinas para entrenadores, que permite:

- ✅ Crear, editar y eliminar rutinas
- ✅ Agregar ejercicios a rutinas con detalles (series, repeticiones, descanso)
- ✅ Asignar rutinas a múltiples clientes
- ✅ Vista con tabs: Ejercicios y Rutinas
- ✅ Tema oscuro coherente en toda la interfaz

## 🗄️ **PASO 1: Ejecutar SQL en Supabase**

**Archivo:** `database/rutinas-schema.sql`

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `rutinas-schema.sql`
4. Ejecuta el script (botón "Run")

Esto creará:
- `rutinas` - Tabla principal de rutinas
- `rutinas_ejercicios` - Relación rutinas-ejercicios con detalles
- `rutinas_clientes` - Asignación de rutinas a clientes

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`database/rutinas-schema.sql`**
   - Script SQL completo con tablas, índices, triggers y constraints

2. **`src/app/services/rutina.service.ts`**
   - Servicio con métodos CRUD completos para rutinas
   - Métodos para gestionar ejercicios dentro de rutinas
   - Métodos para asignar rutinas a clientes

### Archivos Modificados

1. **`src/app/ver-ejercicios/ver-ejercicios.component.ts`**
   - ✅ Imports de `RutinaService` y `ClienteService`
   - ✅ Propiedades para rutinas, modales y filtros
   - ✅ Variable `segmentValue` para controlar tabs
   - ✅ Métodos completos: cargarRutinas, guardarRutina, eliminarRutina
   - ✅ Métodos para agregar/eliminar ejercicios de rutina
   - ✅ Métodos para asignar rutinas a clientes
   - ✅ Gestión de orden de ejercicios (mover arriba/abajo)

2. **`src/app/ver-ejercicios/ver-ejercicios.component.html`**
   - ⚠️ **PENDIENTE DE ACTUALIZAR** (ver instrucciones abajo)

3. **`src/app/ver-ejercicios/ver-ejercicios.component.scss`**
   - ⚠️ **PENDIENTE DE ACTUALIZAR** (ver instrucciones abajo)

4. **`src/global.scss`** y **`src/index.html`**
   - ✅ Forzado tema oscuro permanente

## 🎨 **PASO 2: Actualizar HTML (PENDIENTE)**

El archivo `ver-ejercicios.component.html` necesita una actualización significativa para agregar:

### Cambios necesarios en el HTML:

1. **Tab de Ejercicios** (ya existe, envolver en `<div *ngIf="segmentValue === 'ejercicios'">`):
   - Mantener todo el código actual de ejercicios dentro de este div

2. **Tab de Rutinas** (NUEVO - agregar después del tab de ejercicios):

```html
<!-- ============================================ -->
<!-- TAB DE RUTINAS -->
<!-- ============================================ -->
<div *ngIf="segmentValue === 'rutinas'">
  
  <!-- Filtros de Rutinas -->
  <div class="filters-section">
    <ion-searchbar 
      [(ngModel)]="filtroTextoRutina" 
      (ionInput)="aplicarFiltrosRutinas()"
      placeholder="Buscar rutinas..."
      show-clear-button="focus">
    </ion-searchbar>

    <div class="filter-row">
      <ion-select 
        [(ngModel)]="filtroNivelRutina" 
        (ionChange)="aplicarFiltrosRutinas()"
        placeholder="Nivel"
        interface="popover">
        <ion-select-option value="">Todos los niveles</ion-select-option>
        <ion-select-option *ngFor="let nivel of nivesDificultad" [value]="nivel.value">
          {{ nivel.label }}
        </ion-select-option>
      </ion-select>

      <ion-button fill="clear" (click)="limpiarFiltrosRutinas()">
        <ion-icon name="refresh"></ion-icon>
      </ion-button>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loadingRutinas" class="loading-container">
    <ion-spinner name="crescent"></ion-spinner>
    <p>Cargando rutinas...</p>
  </div>

  <!-- Lista de Rutinas -->
  <div *ngIf="!loadingRutinas" class="exercises-grid">
    
    <!-- Sin rutinas -->
    <div *ngIf="rutinasFiltradas.length === 0" class="no-exercises">
      <ion-icon name="fitness-outline" size="large"></ion-icon>
      <h3>No hay rutinas</h3>
      <p *ngIf="filtroTextoRutina || filtroNivelRutina">
        No se encontraron rutinas con estos filtros
      </p>
      <p *ngIf="!filtroTextoRutina && !filtroNivelRutina">
        Aún no has creado rutinas
      </p>
      <ion-button fill="outline" (click)="abrirModalRutina()">
        Crear primera rutina
      </ion-button>
    </div>

    <!-- Cards de Rutinas -->
    <ion-card *ngFor="let rutina of rutinasFiltradas; trackBy: trackByIndex" class="exercise-card rutina-card">
      <ion-card-header>
        <div class="card-header-content">
          <div class="exercise-info">
            <ion-card-title>{{ rutina.nombre }}</ion-card-title>
            <ion-card-subtitle>
              <div class="subtitle-row">
                <ion-badge color="primary" class="category-badge">
                  {{ rutina.duracion_semanas }} semanas
                </ion-badge>
                <ion-badge color="medium" class="difficulty-badge">
                  {{ getNivelLabel(rutina.nivel_dificultad) }}
                </ion-badge>
              </div>
              <span class="muscle-group" *ngIf="rutina.objetivo">
                <ion-icon name="trophy" size="small"></ion-icon>
                {{ rutina.objetivo }}
              </span>
            </ion-card-subtitle>
          </div>
          <div class="actions">
            <ion-button fill="clear" size="small" (click)="abrirModalRutina(rutina)" class="action-btn edit-btn">
              Modificar
            </ion-button>
            <ion-button fill="clear" size="small" (click)="eliminarRutina(rutina)" class="action-btn delete-btn">
              <ion-icon name="trash"></ion-icon>
            </ion-button>
          </div>
        </div>
      </ion-card-header>

      <ion-card-content>
        <p *ngIf="rutina.descripcion" class="description">
          {{ rutina.descripcion }}
        </p>
        
        <div class="exercise-details">
          <div class="detail-item">
            <ion-icon name="barbell-outline"></ion-icon>
            <span>{{ rutina.cantidad_ejercicios || 0 }} ejercicios</span>
          </div>

          <div class="detail-item">
            <ion-icon name="people-outline"></ion-icon>
            <span>{{ rutina.clientes_asignados || 0 }} clientes</span>
          </div>
        </div>

        <ion-button 
          expand="block" 
          fill="outline" 
          (click)="abrirModalAsignar(rutina)"
          class="assign-button">
          <ion-icon name="person-add" slot="start"></ion-icon>
          Asignar a Clientes
        </ion-button>
      </ion-card-content>
    </ion-card>
  </div>

</div>
```

3. **Modal de Rutina** (NUEVO - agregar al final, después del modal de ejercicios):

```html
<!-- ============================================ -->
<!-- MODAL PARA AGREGAR/EDITAR RUTINA -->
<!-- ============================================ -->
<ion-modal [isOpen]="showModalRutina" (didDismiss)="cerrarModalRutina()">
  <ng-template>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ editModeRutina ? 'Editar' : 'Nueva' }} Rutina</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrarModalRutina()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <form (ngSubmit)="guardarRutina()">
        
        <!-- Información básica -->
        <div class="form-section">
          <h4>Información de la Rutina</h4>
          
          <ion-item>
            <ion-label position="stacked">Nombre de la rutina *</ion-label>
            <ion-input 
              [(ngModel)]="rutinaActual.nombre" 
              name="nombre"
              placeholder="Ej: Rutina de fuerza 4 semanas"
              required>
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea 
              [(ngModel)]="rutinaActual.descripcion" 
              name="descripcion"
              placeholder="Descripción breve de la rutina"
              rows="3">
            </ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Objetivo</ion-label>
            <ion-input 
              [(ngModel)]="rutinaActual.objetivo" 
              name="objetivo"
              placeholder="Ej: Ganar masa muscular, Perder peso">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Duración (semanas)</ion-label>
            <ion-input 
              [(ngModel)]="rutinaActual.duracion_semanas" 
              name="duracion_semanas"
              type="number"
              min="1"
              placeholder="4">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Nivel de dificultad *</ion-label>
            <ion-select [(ngModel)]="rutinaActual.nivel_dificultad" name="nivel_dificultad" interface="popover">
              <ion-select-option *ngFor="let nivel of nivesDificultad" [value]="nivel.value">
                {{ nivel.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>

        <!-- Ejercicios de la rutina -->
        <div class="form-section">
          <h4>Ejercicios de la Rutina</h4>
          
          <!-- Buscador de ejercicios -->
          <ion-item>
            <ion-label position="stacked">Buscar ejercicio para agregar</ion-label>
            <ion-select 
              placeholder="Seleccionar ejercicio"
              interface="popover"
              (ionChange)="agregarEjercicioARutina($event.detail.value)">
              <ion-select-option *ngFor="let ej of ejerciciosDisponibles" [value]="ej">
                {{ ej.nombre }} - {{ ej.musculo_principal }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Lista de ejercicios seleccionados -->
          <div class="selected-exercises-list" *ngIf="ejerciciosSeleccionados.length > 0">
            <div *ngFor="let ejSel of ejerciciosSeleccionados; let i = index; trackBy: trackByIndex" 
                 class="selected-exercise-item">
              <div class="exercise-order">
                <span class="order-number">{{ i + 1 }}</span>
                <div class="order-controls">
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    (click)="moverEjercicioArriba(i)"
                    [disabled]="i === 0">
                    <ion-icon name="chevron-up"></ion-icon>
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    (click)="moverEjercicioAbajo(i)"
                    [disabled]="i === ejerciciosSeleccionados.length - 1">
                    <ion-icon name="chevron-down"></ion-icon>
                  </ion-button>
                </div>
              </div>

              <div class="exercise-details-form">
                <h5>{{ ejSel.ejercicio?.nombre }}</h5>
                
                <div class="exercise-params">
                  <ion-item lines="none">
                    <ion-label position="stacked">Series</ion-label>
                    <ion-input 
                      [(ngModel)]="ejSel.series" 
                      [name]="'series_' + i"
                      type="number"
                      min="1"
                      placeholder="3">
                    </ion-input>
                  </ion-item>

                  <ion-item lines="none">
                    <ion-label position="stacked">Repeticiones</ion-label>
                    <ion-input 
                      [(ngModel)]="ejSel.repeticiones" 
                      [name]="'reps_' + i"
                      placeholder="10-12">
                    </ion-input>
                  </ion-item>

                  <ion-item lines="none">
                    <ion-label position="stacked">Descanso (seg)</ion-label>
                    <ion-input 
                      [(ngModel)]="ejSel.descanso_segundos" 
                      [name]="'descanso_' + i"
                      type="number"
                      placeholder="60">
                    </ion-input>
                  </ion-item>
                </div>

                <ion-item lines="none">
                  <ion-label position="stacked">Notas</ion-label>
                  <ion-textarea 
                    [(ngModel)]="ejSel.notas" 
                    [name]="'notas_' + i"
                    rows="2"
                    placeholder="Instrucciones especiales...">
                  </ion-textarea>
                </ion-item>
              </div>

              <ion-button 
                fill="clear" 
                color="danger" 
                size="small"
                (click)="eliminarEjercicioDeRutina(i)"
                class="remove-exercise-btn">
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </div>
          </div>

          <ion-note *ngIf="ejerciciosSeleccionados.length === 0" class="empty-note">
            No hay ejercicios agregados. <span class="add-hint">Selecciona ejercicios arriba para agregar</span>
          </ion-note>
        </div>

        <!-- Botones -->
        <div class="form-actions">
          <ion-button expand="block" type="submit" [disabled]="loadingRutinas">
            <ion-spinner *ngIf="loadingRutinas" name="crescent"></ion-spinner>
            <span *ngIf="!loadingRutinas">{{ editModeRutina ? 'Actualizar' : 'Crear' }} Rutina</span>
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ng-template>
</ion-modal>
```

4. **Modal de Asignación** (NUEVO - agregar después del modal de rutina):

```html
<!-- ============================================ -->
<!-- MODAL PARA ASIGNAR RUTINA A CLIENTES -->
<!-- ============================================ -->
<ion-modal [isOpen]="showModalAsignar" (didDismiss)="cerrarModalAsignar()">
  <ng-template>
    <ion-header>
      <ion-toolbar>
        <ion-title>Asignar Rutina</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrarModalAsignar()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <div class="form-section">
        <h4>{{ rutinaParaAsignar?.nombre }}</h4>
        <p class="description">Selecciona los clientes a los que deseas asignar esta rutina</p>

        <!-- Lista de clientes con checkboxes -->
        <div class="clients-list">
          <ion-item *ngFor="let cliente of clientesDisponibles" 
                    lines="full"
                    (click)="toggleClienteSeleccionado(cliente.id)"
                    [class.selected]="isClienteSeleccionado(cliente.id)"
                    button>
            <ion-checkbox 
              slot="start" 
              [checked]="isClienteSeleccionado(cliente.id)">
            </ion-checkbox>
            <ion-label>
              <h3>{{ cliente.nombre }} {{ cliente.apellido }}</h3>
              <p *ngIf="cliente.correo">{{ cliente.correo }}</p>
            </ion-label>
          </ion-item>
        </div>

        <ion-note *ngIf="clientesDisponibles.length === 0" class="empty-note">
          No hay clientes disponibles
        </ion-note>
      </div>

      <!-- Fechas y notas -->
      <div class="form-section">
        <h4>Detalles de Asignación</h4>

        <ion-item>
          <ion-label position="stacked">Fecha de inicio</ion-label>
          <ion-input 
            [(ngModel)]="fechaInicioAsignacion" 
            name="fechaInicio"
            type="date">
          </ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Fecha de fin (opcional)</ion-label>
          <ion-input 
            [(ngModel)]="fechaFinAsignacion" 
            name="fechaFin"
            type="date">
          </ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Notas</ion-label>
          <ion-textarea 
            [(ngModel)]="notasAsignacion" 
            name="notas"
            rows="3"
            placeholder="Instrucciones o comentarios adicionales...">
          </ion-textarea>
        </ion-item>
      </div>

      <!-- Botones -->
      <div class="form-actions">
        <ion-button 
          expand="block" 
          (click)="confirmarAsignacion()" 
          [disabled]="loadingRutinas || clientesSeleccionados.length === 0">
          <ion-spinner *ngIf="loadingRutinas" name="crescent"></ion-spinner>
          <span *ngIf="!loadingRutinas">
            Asignar a {{ clientesSeleccionados.length }} cliente(s)
          </span>
        </ion-button>
      </div>
    </ion-content>
  </ng-template>
</ion-modal>
```

### Dónde agregar cada sección:

1. El **Tab de Rutinas**: Agregar justo antes del cierre de `</ion-content>`, después de todo el código de ejercicios
2. El **Modal de Rutina**: Agregar después del modal de ejercicios (después del cierre `</ion-modal>` del modal de ejercicios)
3. El **Modal de Asignación**: Agregar después del modal de rutina

## 🎨 **PASO 3: Actualizar SCSS (PENDIENTE)**

El archivo `ver-ejercicios.component.scss` necesita estilos adicionales:

```scss
// === TABS / SEGMENT ===
ion-segment {
  --background: transparent;
  
  ion-segment-button {
    --color: var(--light-gray);
    --color-checked: var(--primary-green);
    --indicator-color: var(--primary-green);
    --indicator-height: 3px;
    font-weight: 600;
    text-transform: none;
    font-size: 1rem;
    
    &::part(indicator-background) {
      background: var(--primary-green);
    }
  }
}

// === CARDS DE RUTINAS ===
.rutina-card {
  .assign-button {
    --border-color: var(--primary-green);
    --color: var(--primary-green);
    margin-top: 16px;
    font-weight: 600;
    
    &:hover {
      --background: rgba(0, 255, 136, 0.1);
    }
  }
}

// === MODAL DE RUTINA ===
.selected-exercises-list {
  margin-top: 20px;
  
  .selected-exercise-item {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--medium-gray);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: var(--primary-green);
      box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.1);
    }
    
    .exercise-order {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .order-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--primary-green);
        color: var(--black-bg);
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.9rem;
      }
      
      .order-controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        ion-button {
          --padding-start: 4px;
          --padding-end: 4px;
          width: 32px;
          height: 28px;
          
          ion-icon {
            font-size: 1.1rem;
          }
        }
      }
    }
    
    .exercise-details-form {
      flex: 1;
      
      h5 {
        color: var(--primary-green);
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0 0 12px 0;
      }
      
      .exercise-params {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 12px;
        
        ion-item {
          --background: rgba(0, 0, 0, 0.2);
          --padding-start: 12px;
          --padding-end: 12px;
          border-radius: 8px;
          
          ion-label {
            font-size: 0.85rem;
            margin-bottom: 4px;
          }
          
          ion-input {
            font-size: 0.95rem;
            --padding-top: 4px;
            --padding-bottom: 4px;
          }
        }
      }
      
      ion-textarea {
        font-size: 0.9rem;
      }
    }
    
    .remove-exercise-btn {
      --color: #ff4757;
      flex-shrink: 0;
      margin-top: 8px;
    }
  }
}

// === MODAL DE ASIGNACIÓN ===
.clients-list {
  max-height: 400px;
  overflow-y: auto;
  margin: 16px 0;
  border: 1px solid var(--medium-gray);
  border-radius: 12px;
  
  ion-item {
    --background: rgba(0, 0, 0, 0.2);
    --border-color: var(--medium-gray);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.selected {
      --background: rgba(0, 255, 136, 0.1);
      --border-color: var(--primary-green);
      
      ion-label h3 {
        color: var(--primary-green);
      }
    }
    
    &:hover {
      --background: rgba(0, 255, 136, 0.05);
    }
    
    ion-checkbox {
      --border-color: var(--primary-green);
      --background-checked: var(--primary-green);
      --checkmark-color: var(--black-bg);
    }
    
    ion-label {
      h3 {
        color: var(--primary-green);
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 4px;
      }
      
      p {
        color: var(--light-gray);
        font-size: 0.85rem;
      }
    }
  }
}

// Responsive para ejercicios en rutina
@media (max-width: 768px) {
  .selected-exercises-list {
    .selected-exercise-item {
      flex-direction: column;
      
      .exercise-order {
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
        
        .order-controls {
          flex-direction: row;
        }
      }
      
      .exercise-details-form {
        .exercise-params {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
```

## ✅ Estado Actual

### Completado
- ✅ Esquema SQL para las tablas de rutinas
- ✅ Servicio `rutina.service.ts` con todos los métodos
- ✅ Lógica TypeScript completa en `ver-ejercicios.component.ts`
- ✅ Tema oscuro forzado globalmente

### Pendiente (Manual)
- ⚠️ Actualizar HTML con tabs y modales (copiar código de arriba)
- ⚠️ Actualizar SCSS con estilos de rutinas (copiar código de arriba)

## 🚀 Cómo Probar

1. Ejecuta el SQL en Supabase
2. Actualiza el HTML copiando las secciones indicadas
3. Actualiza el SCSS copiando los estilos
4. Ejecuta la app:
   ```powershell
   npm run mobile:deploy
   ```
   o
   ```powershell
   ionic serve
   ```

5. Navega a "Panel Entrenador" → "Ejercicios" (ahora muestra tabs)
6. Prueba crear una rutina, agregar ejercicios, y asignarla a clientes

## 📝 Notas Importantes

- Los ejercicios en una rutina se pueden reordenar (flechas arriba/abajo)
- Cada ejercicio en una rutina tiene: series, repeticiones, descanso y notas
- Una rutina puede asignarse a múltiples clientes simultáneamente
- Las asignaciones tienen fechas de inicio/fin y estado (pendiente, en progreso, completada, etc.)
- El tema oscuro está forzado en toda la app

## 🔧 Troubleshooting

Si ves errores de compilación:
1. Verifica que `ClienteService` esté correctamente importado
2. Asegúrate de que el método `listarClientes()` exista en `ClienteService`
3. Revisa que todos los imports estén correctos en el `.ts`

Si la UI no se ve bien:
1. Asegúrate de copiar TODO el código SCSS proporcionado
2. Verifica que las clases CSS coincidan entre HTML y SCSS
3. Recarga la app después de cambiar estilos

---

**Desarrollado para RetoFitness** | Fecha: 2 de diciembre de 2025
