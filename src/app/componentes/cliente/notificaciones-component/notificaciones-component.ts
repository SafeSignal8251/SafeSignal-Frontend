import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { NotificacionService } from '../../../services/notificacion-service';
import { Notificacion } from '../../../model/notificacion';
import { mensajeError } from '../../../core/mensajes';
import { hace } from '../../../core/utilidades';

@Component({
  imports: [RouterLink, MatButton, MatIcon],
  selector: 'app-notificaciones-component',
  styleUrl: './notificaciones-component.css',
  templateUrl: './notificaciones-component.html',
})
export class NotificacionesComponent {
  auth: AuthService = inject(AuthService);
  notificacionService: NotificacionService = inject(NotificacionService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  notificaciones: Notificacion[] = [];
  error: string = '';

  ngOnInit() {
    this.notificacionService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (n) => {
        this.notificaciones = n;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  get noLeidas(): number {
    return this.notificaciones.filter((n) => n.estado !== 'LEIDA').length;
  }

  icono(n: Notificacion): string {
    if (n.tipo === 'AVISO') { return 'campaign'; }
    if (n.id_alerta) { return 'emergency'; }
    return 'notifications';
  }

  clase(n: Notificacion): string {
    const s = (n.severidad ?? '').toUpperCase();
    if (s === 'ALTA' || s === 'URGENTE') { return 'alta'; }
    if (s === 'MEDIA' || s === 'PREVENTIVO') { return 'media'; }
    return 'baja';
  }

  marcarLeida(n: Notificacion) {
    if (n.estado === 'LEIDA') {
      return;
    }
    this.notificacionService.cambiarEstado(n.id_notificacion, 'LEIDA').subscribe({
      next: () => {
        n.estado = 'LEIDA';
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  marcarTodas() {
    for (const n of this.notificaciones.filter((x) => x.estado !== 'LEIDA')) {
      this.marcarLeida(n);
    }
  }
}
