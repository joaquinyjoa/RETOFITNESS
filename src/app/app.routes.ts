import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'panel-cliente',
    loadComponent: () => import('./panel-cliente/panel-cliente.component').then((m) => m.PanelClienteComponent),
  },
  {
    path: 'panel-entrenador',
    loadComponent: () => import('./panel-entrenador/panel-entrenador.component').then((m) => m.PanelEntrenadorComponent),
  },
  {
    path: 'panel-recepcion',
    loadComponent: () => import('./panel-recepcion/panel-recepcion.component').then((m) => m.PanelRecepcionComponent),
  },
  {
    path: 'ver-clientes',
    loadComponent: () => import('./ver-clientes/ver-clientes.component').then((m) => m.VerClientesComponent),
  },
  {
    path: 'editar-cliente/:id',
    loadComponent: () => import('./editar-cliente/editar-cliente.component').then((m) => m.EditarClienteComponent),
  },
  {
    path: 'ver-ejercicios',
    loadComponent: () => import('./ver-ejercicios/ver-ejercicios.component').then((m) => m.VerEjerciciosComponent),
  },
  {
    path: 'asignar-rutina/:id',
    loadComponent: () => import('./asignar-rutina/asignar-rutina.component').then((m) => m.AsignarRutinaComponent),
  },
  {
    path: 'ver-rutina-cliente/:id',
    loadComponent: () => import('./ver-rutina-cliente/ver-rutina-cliente.component').then((m) => m.VerRutinaClienteComponent),
  },
  {
    path: 'asignar-rutina-cliente-seleccionado/:id',
    loadComponent: () => import('./asignar-rutina-cliente-seleccionado/asignar-rutina-cliente-seleccionado.component').then((m) => m.AsignarRutinaClienteSeleccionadoComponent),
  },
  {
    path: 'configurar-ejercicio/:id/:clienteId',
    loadComponent: () => import('./configurar-ejercicio/configurar-ejercicio.component').then((m) => m.ConfigurarEjercicioComponent),
  },
  {
    path: 'cambiar-password/:id',
    loadComponent: () => import('./cambiar-password/cambiar-password.component').then((m) => m.CambiarPasswordComponent),
  },
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
];
