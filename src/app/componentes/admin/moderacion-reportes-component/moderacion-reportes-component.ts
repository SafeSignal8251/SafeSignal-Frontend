import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IncidenteService } from '../../../services/incidente-service';
import { ComentarioService } from '../../../services/comentario-service';
import { ValidacionService } from '../../../services/validacion-service';
import { UsuarioService } from '../../../services/usuario-service';
import { Incidente } from '../../../model/incidente';
import { Comentario } from '../../../model/comentario';
import { Usuario } from '../../../model/usuario';
import { mensajeError } from '../../../core/mensajes';
import { colorRiesgo, hace } from '../../../core/utilidades';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [MatButton, MatIcon, MapaComponent],
  selector: 'app-moderacion-reportes-component',
  styleUrl: './moderacion-reportes-component.css',
  templateUrl: './moderacion-reportes-component.html',
})
export class ModeracionReportesComponent {
  incidenteService: IncidenteService = inject(IncidenteService);
  comentarioService: ComentarioService = inject(ComentarioService);
  validacionService: ValidacionService = inject(ValidacionService);
  usuarioService: UsuarioService = inject(UsuarioService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  colorRiesgo = colorRiesgo;
  denunciados: Incidente[] = [];
  seleccionado: Incidente | null = null;
  autor: Usuario | null = null;
  comentarios: Comentario[] = [];
  falsas: number = 0;
  confirmadas: number = 0;
  descartados: number = 0;
  verificados: number = 0;
  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.incidenteService.denunciados().subscribe({
      next: (lista) => {
        this.denunciados = lista;
        const actual = this.seleccionado ? lista.find((i) => i.id_incidente === this.seleccionado?.id_incidente) : null;
        if (actual) {
          this.seleccionar(actual);
        } else if (lista.length > 0) {
          this.seleccionar(lista[0]);
        } else {
          this.seleccionado = null;
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.incidenteService.list().subscribe({
      next: (todos) => {
        this.descartados = todos.filter((i) => i.estado === 'ELIMINADO').length;
        this.verificados = todos.filter((i) => i.estado === 'VERIFICADO').length;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }

  get indice(): string {
    const total = this.verificados + this.descartados;
    return total === 0 ? '—' : ((this.verificados / total) * 100).toFixed(1) + '%';
  }

  seleccionar(i: Incidente) {
    this.seleccionado = i;
    this.autor = null;
    this.comentarios = [];
    this.usuarioService.listId(i.id_usuario).subscribe({
      next: (u) => {
        this.autor = u;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.comentarioService.listPorIncidente(i.id_incidente).subscribe({
      next: (c) => {
        this.comentarios = c;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.validacionService.contarVotos(i.id_incidente, 'FALSA_ALARMA').subscribe({
      next: (n) => {
        this.falsas = n;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.validacionService.contarVotos(i.id_incidente, 'CONFIRMADO').subscribe({
      next: (n) => {
        this.confirmadas = n;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  mantener() {
    if (!this.seleccionado) {
      return;
    }
    this.incidenteService.moderar(this.seleccionado.id_incidente, false).subscribe({
      next: () => {
        this.mensaje = 'El reporte se mantiene como válido (VERIFICADO).';
        this.error = '';
        this.cargar();
      },
      error: (e) => this.fallo(e),
    });
  }

  descartar() {
    if (!this.seleccionado) {
      return;
    }
    const i = this.seleccionado;
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '520px',
        data: {
          titulo: 'Confirmar descarte de reporte',
          mensaje: 'El reporte dejará de mostrarse en el mapa comunitario.',
          detalle: '#REP-' + i.id_incidente + ' · ' + i.tipo_incidente,
          peligro: true,
          icono: 'delete',
          tituloOpciones: 'Motivos administrativos',
          opciones: ['Falsa alarma comprobada en sitio (móvil verificó normalidad)', 'Reporte duplicado o spam', 'Otro motivo administrativo'],
          textoConfirmar: 'Confirmar descarte de reporte',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.incidenteService.moderar(i.id_incidente, true).subscribe({
            next: () => {
              this.mensaje = 'Reporte #REP-' + i.id_incidente + ' descartado.';
              this.error = '';
              this.seleccionado = null;
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }
}
