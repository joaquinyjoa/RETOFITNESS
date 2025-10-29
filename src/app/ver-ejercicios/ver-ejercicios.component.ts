import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EjercicioService } from '../services/ejercicio.service';
import { ToastService } from '../services/toast.service';
import { Ejercicio, EjercicioFormData } from '../models/ejercicio/ejercicio.interface';

@Component({
  selector: 'app-ver-ejercicios',
  templateUrl: './ver-ejercicios.component.html',
  styleUrls: ['./ver-ejercicios.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class VerEjerciciosComponent implements OnInit {

  ejercicios: Ejercicio[] = [];
  ejerciciosFiltrados: Ejercicio[] = [];
  loading = false;
  
  // Validación de URL
  urlValida = false;
  
  // Modal para agregar/editar ejercicio
  showModal = false;
  editMode = false;
  ejercicioActual: EjercicioFormData = this.getEmptyForm();

  // Filtros
  filtroTexto = '';
  filtroCategoria = '';
  filtroMusculo = '';

  // Opciones para los select
  categorias = [
    { value: 'cardio', label: 'Cardio' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'flexibilidad', label: 'Flexibilidad' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'general', label: 'General' }
  ];

  nivesDificultad = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  gruposMusculares = [
    'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Glúteos', 
    'Core', 'Abdomen', 'Cardio', 'Cuerpo completo'
  ];

  constructor(
    private ejercicioService: EjercicioService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEjercicios();
  }

  async cargarEjercicios() {
    this.loading = true;
    try {
      const ejerciciosCargados = await this.ejercicioService.listarEjercicios();
      // Convertir duración de minutos a segundos para mostrar en la interfaz
      this.ejercicios = ejerciciosCargados.map(ejercicio => ({
        ...ejercicio,
        duracion_minutos: ejercicio.duracion_minutos ? ejercicio.duracion_minutos * 60 : undefined // Convertir minutos a segundos
      }));
      this.aplicarFiltros();
      console.log('Ejercicios cargados:', this.ejercicios);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
      await this.toastService.mostrarError('Error al cargar ejercicios');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    this.ejerciciosFiltrados = this.ejercicios.filter(ejercicio => {
      const coincideTexto = !this.filtroTexto || 
        ejercicio.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        ejercicio.descripcion?.toLowerCase().includes(this.filtroTexto.toLowerCase());
      
      const coincideCategoria = !this.filtroCategoria || ejercicio.categoria === this.filtroCategoria;
      const coincideMusculo = !this.filtroMusculo || ejercicio.musculo_principal === this.filtroMusculo;

      return coincideTexto && coincideCategoria && coincideMusculo;
    });
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroCategoria = '';
    this.filtroMusculo = '';
    this.aplicarFiltros();
  }

  abrirModal(ejercicio?: Ejercicio) {
    this.editMode = !!ejercicio;
    if (ejercicio) {
      this.ejercicioActual = {
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion || '',
        categoria: ejercicio.categoria,
        musculo_principal: ejercicio.musculo_principal,
        musculos_secundarios: ejercicio.musculos_secundarios || [],
        nivel_dificultad: ejercicio.nivel_dificultad,
        enlace_video: ejercicio.enlace_video,
        duracion_minutos: ejercicio.duracion_minutos || null,
        equipamiento: ejercicio.equipamiento || [],
        instrucciones: ejercicio.instrucciones || '',
        consejos: ejercicio.consejos || ''
      };
    } else {
      this.ejercicioActual = this.getEmptyForm();
    }
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.ejercicioActual = this.getEmptyForm();
  }

  async guardarEjercicio() {
    try {
      // Validaciones básicas
      if (!this.ejercicioActual.nombre.trim()) {
        await this.toastService.mostrarError('El nombre del ejercicio es obligatorio');
        return;
      }

      if (!this.ejercicioActual.enlace_video.trim()) {
        await this.toastService.mostrarError('La URL del video es obligatoria');
        return;
      }

      if (!this.urlValida) {
        await this.toastService.mostrarError('La URL de Google Drive no es válida');
        return;
      }

      this.loading = true;

      const ejercicioData: Ejercicio = {
        ...this.ejercicioActual,
        categoria: this.ejercicioActual.categoria as 'cardio' | 'fuerza' | 'flexibilidad' | 'funcional' | 'general',
        nivel_dificultad: this.ejercicioActual.nivel_dificultad as 'principiante' | 'intermedio' | 'avanzado',
        duracion_minutos: this.ejercicioActual.duracion_minutos ? this.ejercicioActual.duracion_minutos / 60 : undefined, // Convertir segundos a minutos
        musculos_secundarios: this.ejercicioActual.musculos_secundarios.filter(m => m.trim()),
        equipamiento: this.ejercicioActual.equipamiento.filter(e => e.trim())
      };

      const result = await this.ejercicioService.crearEjercicio(ejercicioData);

      if (result.success) {
        await this.toastService.mostrarExito('Ejercicio guardado correctamente');
        this.cerrarModal();
        await this.cargarEjercicios();
      } else {
        await this.toastService.mostrarError(result.error || 'Error al guardar ejercicio');
      }
    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error);
      await this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      this.loading = false;
    }
  }

  // Validar URL de Google Drive
  validarUrlDrive() {
    const url = this.ejercicioActual.enlace_video.trim();
    
    if (!url) {
      this.urlValida = false;
      return;
    }

    // Patrones válidos para URLs de Google Drive
    const patronesValidos = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/view/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/preview/,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9-_]+/
    ];

    this.urlValida = patronesValidos.some(patron => patron.test(url));
    
    if (!this.urlValida) {
      this.toastService.mostrarError('URL de Google Drive no válida. Formato: drive.google.com/file/d/ID/view');
    }
  }

  // Vista previa del video
  previsualizarVideo() {
    if (this.urlValida && this.ejercicioActual.enlace_video) {
      const url = this.convertirAPreview(this.ejercicioActual.enlace_video);
      window.open(url, '_blank', 'width=800,height=600');
    }
  }

  // Convertir URL a formato preview
  private convertirAPreview(url: string): string {
    // Extraer el ID del archivo
    let fileId = '';
    
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return url; // Si no se puede convertir, devolver original
  }

  // Convertir segundos a minutos (para la validación)
  convertirSegundosAMinutos() {
    if (this.ejercicioActual.duracion_minutos) {
      // Si el usuario ingresa más de 20 segundos, limitar a 20
      if (this.ejercicioActual.duracion_minutos > 20) {
        this.ejercicioActual.duracion_minutos = 20;
        this.toastService.mostrarError('Duración máxima: 20 segundos');
      }
      
      // Convertir segundos a minutos para almacenar en la base de datos
      // (Mantenemos el valor en segundos en la interfaz, pero se convierte internamente)
    }
  }

  async eliminarEjercicio(ejercicio: Ejercicio) {
    // TODO: Implementar confirmación
    try {
      if (!ejercicio.id) return;

      this.loading = true;
      const result = await this.ejercicioService.desactivarEjercicio(ejercicio.id);

      if (result.success) {
        await this.toastService.mostrarExito('Ejercicio eliminado');
        await this.cargarEjercicios();
      } else {
        await this.toastService.mostrarError(result.error || 'Error al eliminar ejercicio');
      }
    } catch (error) {
      console.error('Error al eliminar ejercicio:', error);
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  verVideo(ejercicio: Ejercicio) {
    const url = this.ejercicioService.convertToDirectViewUrl(ejercicio.enlace_video);
    window.open(url, '_blank');
  }

  // Métodos para manejar arrays dinámicos
  agregarMusculoSecundario() {
    this.ejercicioActual.musculos_secundarios.push('');
  }

  async eliminarMusculoSecundario(index: number) {
    if (this.ejercicioActual.musculos_secundarios.length === 1) {
      await this.toastService.mostrarInfo('Debe mantener al menos un músculo secundario o eliminar todos');
    }
    this.ejercicioActual.musculos_secundarios.splice(index, 1);
  }

  agregarEquipamiento() {
    this.ejercicioActual.equipamiento.push('');
  }

  async eliminarEquipamiento(index: number) {
    if (this.ejercicioActual.equipamiento.length === 1) {
      await this.toastService.mostrarInfo('Eliminando último equipamiento');
    }
    this.ejercicioActual.equipamiento.splice(index, 1);
  }

  // Limpiar todos los músculos secundarios
  limpiarMusculosSecundarios() {
    this.ejercicioActual.musculos_secundarios = [];
  }

  // Limpiar todo el equipamiento
  limpiarEquipamiento() {
    this.ejercicioActual.equipamiento = [];
  }

  trackByIndex(index: number): number {
    return index;
  }

  goBack() {
    this.router.navigate(['/panel-entrenador']);
  }

  getCategoriaColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'cardio': 'primary',
      'fuerza': 'secondary',
      'flexibilidad': 'tertiary',
      'funcional': 'warning',
      'general': 'medium'
    };
    return colores[categoria] || 'medium';
  }

  getCategoriaLabel(categoria: string): string {
    const labels: { [key: string]: string } = {
      'cardio': 'Cardio',
      'fuerza': 'Fuerza',
      'flexibilidad': 'Flexibilidad',
      'funcional': 'Funcional',
      'general': 'General'
    };
    return labels[categoria] || categoria;
  }

  getNivelLabel(nivel: string): string {
    const labels: { [key: string]: string } = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return labels[nivel] || nivel;
  }

  getEquipamientoText(equipamiento: string[]): string {
    if (!equipamiento || equipamiento.length === 0) return 'Sin equipamiento';
    if (equipamiento.length === 1) return equipamiento[0];
    if (equipamiento.length === 2) return equipamiento.join(' y ');
    return `${equipamiento.slice(0, -1).join(', ')} y ${equipamiento[equipamiento.length - 1]}`;
  }

  private getEmptyForm(): EjercicioFormData {
    return {
      nombre: '',
      descripcion: '',
      categoria: 'general',
      musculo_principal: '',
      musculos_secundarios: [],
      nivel_dificultad: 'principiante',
      enlace_video: '',
      duracion_minutos: null,
      equipamiento: [],
      instrucciones: '',
      consejos: ''
    };
  }
}