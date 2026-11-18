import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { NotificacionService } from '../../../services/notificacion-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { Notificacion } from '../../../model/notificacion';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { hace } from '../../../core/utilidades';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [FormsModule, MatButton],
  selector: 'app-centro-comunicacion-component',
  styleUrl: './centro-comunicacion-component.css',
  templateUrl: './centro-comunicacion-component.html',
})
export class CentroComunicacionComponent {
  auth: AuthService = inject(AuthService);
  notificacionService: NotificacionService = inject(NotificacionService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly maximo: number = 200;
  hace = hace;
  zonas: ZonaRiesgo[] = [];
  idZona: number | null = null; // null = todos los distritos
  severidad: string = 'INFORMATIVO';
  texto: string = '';
  historial: { fecha: string; alcance: string; mensaje: string; cantidad: number }[] = [];
  enviando: boolean = false;
  mensaje: string = '';
  error: string = '';

  severidades = [
    { clave: 'INFORMATIVO', texto: 'Informativo' },
    { clave: 'PREVENTIVO', texto: 'Preventivo' },
    { clave: 'URGENTE', texto: 'Urgente' },
  ];

  ngOnInit() {
    this.zonaService.list().subscribe({
      next: (z) => {
        this.zonas = z;
        this.cargarHistorial();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.enviando = false;
    this.cdr.markForCheck();
  }

  // Los avisos enviados se guardan como una notificación por usuario: se agrupan por mensaje y fecha
  cargarHistorial() {
    this.notificacionService.list().subscribe({
      next: (lista: Notificacion[]) => {
        const grupos = new Map<string, { fecha: string; alcance: string; mensaje: string; cantidad: number }>();
        for (const n of lista.filter((x) => x.tipo === 'AVISO')) {
          const clave = n.mensaje + '|' + (n.fecha_envio ?? '').slice(0, 16) + '|' + (n.id_zona ?? 0);
          const existente = grupos.get(clave);
          if (existente) {
            existente.cantidad++;
          } else {
            const zona = this.zonas.find((z) => z.id_zona === n.id_zona);
            grupos.set(clave, { fecha: n.fecha_envio, alcance: zona ? zona.nombre : 'Todos los distritos', mensaje: n.mensaje, cantidad: 1 });
          }
        }
        this.historial = [...grupos.values()].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')).slice(0, 8);
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  get alcanceTexto(): string {
    const z = this.zonas.find((x) => x.id_zona === this.idZona);
    return z ? z.nombre : 'Todos los distritos';
  }

  enviar() {
    if (this.texto.trim() === '') {
      this.fallo({ error: { message: 'Escribe el mensaje del aviso.' } });
      return;
    }
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '520px',
        data: {
          titulo: '¿Confirmar envío de aviso masivo?',
          mensaje: 'Este comunicado será emitido en tiempo real a los dispositivos de los ciudadanos en la zona seleccionada.',
          detalle: 'Alcance: ' + this.alcanceTexto + ' · Severidad: ' + this.severidad + '\n' + this.texto.trim(),
          icono: 'campaign',
          textoConfirmar: 'Confirmar',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.enviando = true;
          this.notificacionService.enviarAviso(this.auth.usuarioId(), this.idZona, this.severidad, this.texto.trim()).subscribe({
            next: (respuesta) => {
              this.enviando = false;
              this.mensaje = 'Aviso enviado. ' + respuesta;
              this.error = '';
              this.texto = '';
              this.cargarHistorial();
              this.cdr.markForCheck();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }
}
