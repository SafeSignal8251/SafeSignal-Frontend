import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [RouterLink, MatIcon],
  selector: 'app-publico-header-component',
  styleUrl: './publico-header-component.css',
  templateUrl: './publico-header-component.html',
})
export class PublicoHeaderComponent {}
