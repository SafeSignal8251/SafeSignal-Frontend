import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { CerrarSesionDialogComponent } from '../cerrar-sesion-dialog-component/cerrar-sesion-dialog-component';

@Component({
  imports: [RouterLink, RouterLinkActive, MatIcon],
  selector: 'app-nav-admin-component',
  styleUrl: './nav-admin-component.css',
  templateUrl: './nav-admin-component.html',
})
export class NavAdminComponent {
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  dialog: MatDialog = inject(MatDialog);

  nombre: string = this.auth.nombreCompleto();
  inicial: string = this.nombre.charAt(0).toUpperCase();

  items = [
    { ruta: '/admin/dashboard', texto: 'Dashboard', icono: 'dashboard' },
    { ruta: '/admin/usuarios', texto: 'Gestión de Usuarios', icono: 'group' },
    { ruta: '/admin/moderacion', texto: 'Moderación Reportes', icono: 'gavel' },
    { ruta: '/admin/umbrales', texto: 'Umbrales de Riesgo', icono: 'tune' },
    { ruta: '/admin/estadisticas', texto: 'Estadísticas Globales', icono: 'monitoring' },
    { ruta: '/admin/comunicacion', texto: 'Centro de comunicación', icono: 'campaign' },
  ];

  cerrarSesion() {
    this.dialog
      .open(CerrarSesionDialogComponent, { width: '440px' })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
      });
  }
}
