import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { CerrarSesionDialogComponent } from '../cerrar-sesion-dialog-component/cerrar-sesion-dialog-component';

@Component({
  imports: [RouterLink, RouterLinkActive, MatButton, MatIcon],
  selector: 'app-nav-cliente-component',
  styleUrl: './nav-cliente-component.css',
  templateUrl: './nav-cliente-component.html',
})
export class NavClienteComponent {
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  dialog: MatDialog = inject(MatDialog);

  nombre: string = this.auth.nombreCompleto();
  inicial: string = this.nombre.charAt(0).toUpperCase();

  items = [
    { ruta: '/dashboard', texto: 'Dashboard', icono: 'dashboard' },
    { ruta: '/mapa-riesgo', texto: 'Mapa de Riesgo', icono: 'map' },
    { ruta: '/historial', texto: 'Historial', icono: 'history' },
    { ruta: '/reportes', texto: 'Reportes', icono: 'description' },
    { ruta: '/estadisticas', texto: 'Estadísticas', icono: 'bar_chart' },
    { ruta: '/configuracion', texto: 'Configuración', icono: 'settings' },
  ];

  // Lleva al dashboard y abre el diálogo de confirmación del SOS
  emergencia() {
    this.router.navigate(['/dashboard'], { queryParams: { sos: 1 } });
  }

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
