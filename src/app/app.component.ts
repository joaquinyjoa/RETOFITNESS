import { Component, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner/spinner.component';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SpinnerService } from './services/spinner.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, CommonModule, SpinnerComponent],
})
export class AppComponent implements OnDestroy {
  spinner$ = this.spinnerService.visible$;
  private subs: Subscription;

  constructor(private router: Router, private spinnerService: SpinnerService) {
    // Subscribe to router events to mark navigation state in the spinner service
    this.subs = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationStart) {
        this.spinnerService.markNavigationStart();
      } else if (evt instanceof NavigationEnd || evt instanceof NavigationCancel || evt instanceof NavigationError) {
        this.spinnerService.markNavigationEnd();
      }
    });
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
