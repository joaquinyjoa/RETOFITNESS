import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  private _visible = new BehaviorSubject<boolean>(false);
  readonly visible$ = this._visible.asObservable();

  private minHideUntil: number | null = null;
  private inNavigation = false;

  show(minDurationMs?: number) {
    if (minDurationMs && minDurationMs > 0) {
      this.minHideUntil = Date.now() + minDurationMs;
    } else {
      this.minHideUntil = null;
    }
    this._visible.next(true);
  }

  hide() {
    // Try to hide immediately only if min duration passed and not in navigation
    if (this.canHideNow()) {
      this.minHideUntil = null;
      this._visible.next(false);
      return;
    }

    // Otherwise schedule a retry when min duration passes or navigation ends
    const when = this.minHideUntil ? Math.max(0, this.minHideUntil - Date.now()) : 0;
    setTimeout(() => {
      if (this.canHideNow()) {
        this.minHideUntil = null;
        this._visible.next(false);
      }
    }, when || 50);
  }

  markNavigationStart() {
    this.inNavigation = true;
  }

  markNavigationEnd() {
    this.inNavigation = false;
    // After navigation ends try to hide if allowed
    if (this.canHideNow()) {
      this.minHideUntil = null;
      this._visible.next(false);
    }
  }

  private canHideNow() {
    const now = Date.now();
    const minOk = !this.minHideUntil || now >= this.minHideUntil;
    return minOk && !this.inNavigation;
  }
}
