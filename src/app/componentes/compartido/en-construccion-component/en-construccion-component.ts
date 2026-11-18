import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';

// Pantalla temporal: las rutas de las fases siguientes apuntan aquí hasta que se cree su componente real.
@Component({
  imports: [RouterLink, MatCard, MatCardTitle, MatCardContent, MatButton, MatIcon],
  selector: 'app-en-construccion-component',
  styleUrl: './en-construccion-component.css',
  templateUrl: './en-construccion-component.html',
})
export class EnConstruccionComponent {
  router: Router = inject(Router);
  auth: AuthService = inject(AuthService);
  ruta: string = this.router.url;
  inicio: string = this.auth.esAdmin() ? '/admin/dashboard' : '/dashboard';
}
