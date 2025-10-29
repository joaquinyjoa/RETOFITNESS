import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-panel-cliente',
  templateUrl: './panel-cliente.component.html',
  styleUrls: ['./panel-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PanelClienteComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
