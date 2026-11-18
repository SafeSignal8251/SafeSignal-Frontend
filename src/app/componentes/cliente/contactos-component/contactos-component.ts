import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { ContactoService } from '../../../services/contacto-service';
import { UsuarioService } from '../../../services/usuario-service';
import { ContactoConfianza } from '../../../model/contacto-confianza';
import { mensajeError } from '../../../core/mensajes';
import { AgregarContactoDialogComponent } from '../../compartido/agregar-contacto-dialog-component/agregar-contacto-dialog-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [MatIcon],
  selector: 'app-contactos-component',
  styleUrl: './contactos-component.css',
  templateUrl: './contactos-component.html',
})
export class ContactosComponent {
  auth: AuthService = inject(AuthService);
  contactoService: ContactoService = inject(ContactoService);
  usuarioService: UsuarioService = inject(UsuarioService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly maximo: number = 5;
  contactos: ContactoConfianza[] = [];
  mensajeSos: string = '';
  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.cargar();
    this.usuarioService.listId(this.auth.usuarioId()).subscribe({
      next: (u) => {
        this.mensajeSos = u.mensaje_sos || '';
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  cargar() {
    this.contactoService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (c) => {
        this.contactos = [...c].sort((a, b) => (a.prioridad ?? 9) - (b.prioridad ?? 9));
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  get cupos(): number {
    return this.maximo - this.contactos.length;
  }

  agregar(contacto: ContactoConfianza | null) {
    if (!contacto && this.cupos <= 0) {
      this.error = 'Alcanzaste el máximo de ' + this.maximo + ' contactos de confianza.';
      return;
    }
    this.dialog
      .open(AgregarContactoDialogComponent, { width: '560px', data: { contacto } })
      .afterClosed()
      .subscribe((guardado) => {
        if (guardado) {
          this.mensaje = contacto ? 'Contacto actualizado.' : 'Contacto agregado.';
          this.error = '';
          this.cargar();
        }
      });
  }

  eliminar(c: ContactoConfianza) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '460px',
        data: {
          titulo: '¿Eliminar contacto de confianza?',
          mensaje: 'Esta acción alterará tu protocolo de seguridad SOS.',
          detalle: c.nombres + ' ' + (c.apellidos ?? '') + ' · ' + c.telefono + ' (Prioridad ' + c.prioridad + ')',
          advertencia: 'Aviso de riesgo: al eliminarlo dejará de recibir alertas automáticas ni tu ubicación en caso de emergencia.',
          peligro: true,
          icono: 'delete',
          textoConfirmar: 'Eliminar contacto',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.contactoService.delete(c.id_contacto).subscribe({
            next: () => {
              this.mensaje = 'Contacto eliminado.';
              this.error = '';
              this.cargar();
            },
            error: (e) => {
              this.error = mensajeError(e);
              this.cdr.markForCheck();
            },
          });
        }
      });
  }

  iniciales(c: ContactoConfianza): string {
    return ((c.nombres ?? '?').charAt(0) + (c.apellidos ?? '').charAt(0)).toUpperCase();
  }
  canales(c: ContactoConfianza): string {
    if (c.notificar_sms && c.notificar_whatsapp) { return 'SMS & WhatsApp'; }
    if (c.notificar_whatsapp) { return 'Solo WhatsApp'; }
    if (c.notificar_sms) { return 'Solo SMS'; }
    return 'Sin canal';
  }
}
