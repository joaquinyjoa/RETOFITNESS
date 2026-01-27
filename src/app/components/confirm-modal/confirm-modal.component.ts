import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ConfirmModalComponent {
  @Input() header: string = 'Confirmar';
  @Input() message: string = '';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmText: string = 'Aceptar';

  constructor(private modalCtrl: ModalController) {}

  cancel() {
    this.modalCtrl.dismiss(false, 'cancel');
  }

  confirm() {
    this.modalCtrl.dismiss(true, 'confirm');
  }
}
