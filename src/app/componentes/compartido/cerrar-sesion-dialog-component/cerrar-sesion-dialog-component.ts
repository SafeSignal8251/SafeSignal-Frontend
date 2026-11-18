import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
// NO VISTO EN CLASE: MatDialog (ventanas emergentes)
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';

@Component({
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, MatIcon],
  selector: 'app-cerrar-sesion-dialog-component',
  styleUrl: './cerrar-sesion-dialog-component.css',
  templateUrl: './cerrar-sesion-dialog-component.html',
})
export class CerrarSesionDialogComponent {
  auth: AuthService = inject(AuthService);
  nombre: string = this.auth.nombreCompleto();
  correo: string = this.auth.sesion$.value ? this.auth.sesion$.value.correo : '';
}
