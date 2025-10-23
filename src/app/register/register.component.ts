import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RegisterComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/welcome']);
  }
}