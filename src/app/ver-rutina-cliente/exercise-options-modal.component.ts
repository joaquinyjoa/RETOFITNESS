import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-exercise-options-modal',
  standalone: true,
  imports: [NgIf,IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonList, IonItem, IonLabel],
  template: `
  <ion-header>
    <ion-toolbar class="neon-toolbar">
      <ion-title>Opciones de ejercicio</ion-title>
      <ion-buttons slot="end">
        <ion-button fill="clear" (click)="close('cancel')">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="modal-content">
    <ion-list>
      <ion-item button (click)="select('changePrincipal')">
        <ion-label>
          <strong>Cambiar ejercicio principal</strong>
        </ion-label>
        <ion-icon slot="end" name="swap-horizontal-outline"></ion-icon>
      </ion-item>

      <ion-item button *ngIf="ejercicioPersonalizado?.ejercicio_alternativo_id" (click)="select('changeAlternative')">
        <ion-label>
          Cambiar ejercicio alternativo
        </ion-label>
        <ion-icon slot="end" name="repeat-outline"></ion-icon>
      </ion-item>

      <ion-item button *ngIf="ejercicioPersonalizado?.ejercicio_alternativo_id" (click)="select('deleteAlternative')">
        <ion-label>
          <span class="destructive">Eliminar ejercicio alternativo</span>
        </ion-label>
        <ion-icon slot="end" name="trash-outline"></ion-icon>
      </ion-item>

      <ion-item button *ngIf="!ejercicioPersonalizado?.ejercicio_alternativo_id" (click)="select('addAlternative')">
        <ion-label>
          Agregar ejercicio alternativo
        </ion-label>
        <ion-icon slot="end" name="add-circle-outline"></ion-icon>
      </ion-item>

      <ion-item button (click)="select('cancel')">
        <ion-label>
          Cancelar
        </ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
  `,
  styles: [`
    :host {
      --background: transparent;
    }
    .neon-toolbar {
      --background: linear-gradient(90deg, #001a0f 0%, rgba(0,255,136,0.06) 50%, #002214 100%);
      border-bottom: 1px solid rgba(0,255,136,0.12);
      color: #ffffff;
      box-shadow: 0 8px 30px rgba(0,255,136,0.12);
    }
    .modal-content {
      padding: 12px;
      background: #0b0b0b;
      color: #ffffff;
    }
    ion-item {
      --background: transparent;
      color: #ffffff;
      --inner-padding-end: 8px;
      --inner-padding-start: 8px;
    }
    ion-item .destructive {
      color: #ff6b6b;
      font-weight: 700;
    }
    ion-icon {
      color: #00ff88;
    }
  `]
})
export class ExerciseOptionsModalComponent {
  ejercicioPersonalizado: any = null;
  private modalCtrl = inject(ModalController);

  // recibimos propiedades vía componentProps al crear el modal
  constructor() {
    // componentProps serán asignadas automáticamente por Ionic cuando se crea el modal
  }

  select(action: string) {
    this.modalCtrl.dismiss({ action });
  }

  close(action: string) {
    this.modalCtrl.dismiss({ action });
  }
}
