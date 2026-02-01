import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface AppState {
  rutinasModificadas: number; // Timestamp de última modificación
  clientesModificados: number;
  ejerciciosModificados: number;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private state = new BehaviorSubject<AppState>({
    rutinasModificadas: 0,
    clientesModificados: 0,
    ejerciciosModificados: 0
  });

  // Observables públicos
  private rutinasSubject = new BehaviorSubject<number>(0);
  private clientesSubject = new BehaviorSubject<number>(0);
  private ejerciciosSubject = new BehaviorSubject<number>(0);

  rutinasModificadas$: Observable<number> = this.rutinasSubject.asObservable();
  clientesModificados$: Observable<number> = this.clientesSubject.asObservable();
  ejerciciosModificados$: Observable<number> = this.ejerciciosSubject.asObservable();

  notifyRutinasModificadas() {
    const now = Date.now();
    this.state.next({ ...this.state.value, rutinasModificadas: now });
    this.rutinasSubject.next(now);
  }

  notifyClientesModificados() {
    const now = Date.now();
    this.state.next({ ...this.state.value, clientesModificados: now });
    this.clientesSubject.next(now);
  }

  notifyEjerciciosModificados() {
    const now = Date.now();
    this.state.next({ ...this.state.value, ejerciciosModificados: now });
    this.ejerciciosSubject.next(now);
  }

  getState(): AppState {
    return this.state.value;
  }
}
