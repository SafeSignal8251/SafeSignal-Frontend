import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { DispositivoService } from '../../../services/dispositivo-service';
import { DispositivoIoT } from '../../../model/dispositivo-iot';
import { mensajeError } from '../../../core/mensajes';
import { hace } from '../../../core/utilidades';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [RouterLink, FormsModule, MatButton, MatIcon],
  selector: 'app-dispositivos-component',
  styleUrl: './dispositivos-component.css',
  templateUrl: './dispositivos-component.html',
})
export class DispositivosComponent {
  auth: AuthService = inject(AuthService);
  dispositivoService: DispositivoService = inject(DispositivoService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  dispositivos: DispositivoIoT[] = [];
  editando: number | null = null;
  nombreEditar: string = '';
  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.dispositivoService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (d) => {
        this.dispositivos = d;
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }

  estado(d: DispositivoIoT): { texto: string; clase: string } {
    if (d.estado !== 'HABILITADO') { return { texto: 'Desconectado', clase: 'badge-gris' }; }
    if ((d.nivel_bateria ?? 100) < 20) { return { texto: 'Batería baja', clase: 'badge-naranja' }; }
    return { texto: 'Conectado', clase: 'badge-verde' };
  }

  colorBateria(d: DispositivoIoT): string {
    const n = d.nivel_bateria ?? 0;
    return n < 20 ? '#e11d48' : n < 50 ? '#e6a817' : '#1e9a5e';
  }

  icono(d: DispositivoIoT): string {
    const t = (d.tipo_dispositivo ?? '').toUpperCase();
    if (t.includes('PULSERA') || t.includes('WATCH')) { return 'watch'; }
    if (t.includes('BOTON') || t.includes('SOS') || t.includes('PANICO')) { return 'shield'; }
    return 'sensors';
  }

  configurar(d: DispositivoIoT) {
    this.editando = this.editando === d.id_dispositivo ? null : d.id_dispositivo;
    this.nombreEditar = d.nombre;
  }

  guardar(d: DispositivoIoT) {
    this.dispositivoService.update(d.id_dispositivo, { nombre: this.nombreEditar }).subscribe({
      next: () => {
        this.mensaje = 'Dispositivo actualizado.';
        this.error = '';
        this.editando = null;
        this.cargar();
      },
      error: (e) => this.fallo(e),
    });
  }

  reconectar(d: DispositivoIoT) {
    this.dispositivoService.update(d.id_dispositivo, { estado: 'HABILITADO' }).subscribe({
      next: () => {
        this.dispositivoService.sincronizar(d.id_dispositivo).subscribe({
          next: () => {
            this.mensaje = 'Dispositivo reconectado y sincronizado.';
            this.error = '';
            this.cargar();
          },
          error: (e) => this.fallo(e),
        });
      },
      error: (e) => this.fallo(e),
    });
  }

  sincronizarTodos() {
    this.dispositivoService.sincronizarTodos(this.auth.usuarioId()).subscribe({
      next: () => {
        this.mensaje = 'Dispositivos sincronizados.';
        this.error = '';
        this.cargar();
      },
      error: (e) => this.fallo(e),
    });
  }

  eliminar(d: DispositivoIoT) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '460px',
        data: {
          titulo: '¿Desvincular este dispositivo?',
          mensaje: 'Dejará de enviar alertas y lecturas a tu cuenta SafeSignal.',
          detalle: d.nombre + ' · S/N ' + d.codigo_dispositivo,
          peligro: true,
          icono: 'link_off',
          textoConfirmar: 'Desvincular',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.dispositivoService.delete(d.id_dispositivo).subscribe({
            next: () => {
              this.mensaje = 'Dispositivo desvinculado.';
              this.error = '';
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }
}
