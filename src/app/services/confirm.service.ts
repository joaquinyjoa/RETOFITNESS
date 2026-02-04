import { Injectable, inject, Injector } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal.component';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private injector = inject(Injector);
  private logger = inject(LoggerService);

  /**
   * Muestra un diálogo de confirmación estilizado en neón para acciones de salida.
   * Retorna `true` si el usuario confirma (Salir), `false` si cancela.
   */
  async confirmExit(
    message: string = '¿Deseas cerrar sesión?',
    header: string = 'Salir',
    confirmLabel: string = 'Salir'
  ): Promise<boolean> {

    try {
      this.logger.debug('[ConfirmService] creating modal', { header, message, confirmLabel });
      const modalCtrl = this.injector.get(ModalController, null as unknown as ModalController | null);

      if (modalCtrl) {
        const modal = await modalCtrl.create({
          component: ConfirmModalComponent,
          componentProps: {
            header,
            message,
            cancelText: 'Cancelar',
            confirmText: confirmLabel
          },
          cssClass: 'confirm-modal-wrapper',
          backdropDismiss: false
        });

        await modal.present();
        const { data, role } = await modal.onWillDismiss();
        return data === true || role === 'confirm';
      }

      // Fallback: si no hay ModalController (p.ej. en algunos contextos), usar AlertController
      this.logger.debug('[ConfirmService] ModalController no disponible, usando AlertController como fallback');
      const alertCtrl = this.injector.get(AlertController) as AlertController;
      const alert = await alertCtrl.create({
        header,
        message,
        cssClass: 'neon-alert',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
          { text: confirmLabel, role: 'confirm', cssClass: 'neon-confirm' }
        ]
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === 'confirm';
    } catch (err) {
      this.logger.error('[ConfirmService] error showing modal/alert', err);
      return false;
    }
  }

  /**
   * Método genérico para confirmar acciones con estilo neón.
   * `confirmLabel` permite personalizar el texto del botón de confirmación.
   */
  async confirm(message: string, header: string = 'Confirmar', confirmLabel: string = 'Aceptar'): Promise<boolean> {
    try {
      this.logger.debug('[ConfirmService] opening generic confirm modal', { header, message, confirmLabel });
      const modalCtrl = this.injector.get(ModalController, null as unknown as ModalController | null);
      if (modalCtrl) {
        const modal = await modalCtrl.create({
          component: ConfirmModalComponent,
          componentProps: {
            header,
            message,
            cancelText: 'Cancelar',
            confirmText: confirmLabel
          },
          cssClass: 'confirm-modal-wrapper',
          backdropDismiss: false
        });
        await modal.present();
        const { data, role } = await modal.onWillDismiss();
        this.logger.debug('[ConfirmService] generic modal dismissed', { data, role });
        return data === true || role === 'confirm';
      }

      this.logger.debug('[ConfirmService] ModalController no disponible, usando AlertController como fallback');
      const alertCtrl = this.injector.get(AlertController) as AlertController;
      const alert = await alertCtrl.create({
        header,
        message,
        cssClass: 'neon-alert',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
          { text: confirmLabel, role: 'confirm', cssClass: 'neon-confirm' }
        ]
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === 'confirm';
    } catch (err) {
      this.logger.error('[ConfirmService] error opening generic modal/alert', err);
      return false;
    }
  }
}
