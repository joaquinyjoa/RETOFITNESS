import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent implements OnInit, OnDestroy {
  
  ngOnInit() {
    // Bloquear scroll cuando el spinner aparece
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    // Restaurar scroll cuando el spinner desaparece
    document.body.style.overflow = '';
  }
}
