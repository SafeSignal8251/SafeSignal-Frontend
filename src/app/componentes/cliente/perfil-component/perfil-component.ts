import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { UsuarioService } from '../../../services/usuario-service';
import { ContactoService } from '../../../services/contacto-service';
import { Usuario } from '../../../model/usuario';
import { ContactoConfianza } from '../../../model/contacto-confianza';
import { mensajeError } from '../../../core/mensajes';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [RouterLink, MatButton],
  selector: 'app-perfil-component',
  styleUrl: './perfil-component.css',
  templateUrl: './perfil-component.html',
})
export class PerfilComponent {
  auth: AuthService = inject(AuthService);
  usuarioService: UsuarioService = inject(UsuarioService);
  contactoService: ContactoService = inject(ContactoService);
  dialog: MatDialog = inject(MatDialog);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  contacto: ContactoConfianza | null = null;
  error: string = '';

  ngOnInit() {
    const id = this.auth.usuarioId();
    this.usuarioService.listId(id).subscribe({
      next: (u) => {
        this.usuario = u;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
    this.contactoService.listPorUsuario(id).subscribe({
      next: (c) => {
        this.contacto = [...c].sort((a, b) => (a.prioridad ?? 9) - (b.prioridad ?? 9))[0] ?? null;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  get inicial(): string {
    return this.usuario ? (this.usuario.nombres ?? '?').charAt(0).toUpperCase() : '?';
  }

  // Reutiliza la pantalla "Crear nueva contraseña" con el correo y DNI de la cuenta
  cambiarContrasena() {
    if (this.usuario) {
      this.auth.recuperacion = { correo: this.usuario.correo, dni: this.usuario.dni };
      this.router.navigate(['/nueva-password']);
    }
  }

  eliminarCuenta() {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '500px',
        data: {
          titulo: '¿Eliminar tu cuenta definitivamente?',
          mensaje: 'Esta acción es permanente: se borrarán tu perfil, rutas, contactos, historial de alertas y configuraciones. No podrás recuperar la información.',
          advertencia: 'Datos que serán purgados de forma irreversible: historial de alertas, rutas, contactos de confianza y dispositivos IoT.',
          peligro: true,
          icono: 'delete_forever',
          textoConfirmar: 'Eliminar definitivamente',
          textoCancelar: 'Conservar mi cuenta',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.usuarioService.delete(this.auth.usuarioId()).subscribe({
            next: () => {
              this.auth.logout();
              this.router.navigate(['/inicio']);
            },
            error: (e) => {
              this.error = mensajeError(e);
              this.cdr.markForCheck();
            },
          });
        }
      });
  }
}
