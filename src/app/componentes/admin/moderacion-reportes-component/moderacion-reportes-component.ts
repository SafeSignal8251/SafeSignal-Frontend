import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IncidenteService } from '../../../services/incidente-service';
import { ComentarioService } from '../../../services/comentario-service';
import { ValidacionService } from '../../../services/validacion-service';
import { UsuarioService } from '../../../services/usuario-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { Incidente } from '../../../model/incidente';
import { Comentario } from '../../../model/comentario';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { Usuario } from '../../../model/usuario';
import { mensajeError } from '../../../core/mensajes';
import { claseEstadoReporte, colorRiesgo, hace, textoEstadoReporte } from '../../../core/utilidades';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [DatePipe, MatButton, MatIcon, MapaComponent],
  selector: 'app-moderacion-reportes-component',
  styleUrl: './moderacion-reportes-component.css',
  templateUrl: './moderacion-reportes-component.html',
})
export class ModeracionReportesComponent implements OnInit, OnDestroy {
  incidenteService: IncidenteService = inject(IncidenteService);
  comentarioService: ComentarioService = inject(ComentarioService);
  validacionService: ValidacionService = inject(ValidacionService);
  usuarioService: UsuarioService = inject(UsuarioService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  dialog: MatDialog = inject(MatDialog);
  route: ActivatedRoute = inject(ActivatedRoute);
  private vistaElegida: boolean = false; // true cuando el admin eligió una pestaña o llegó con ?reporte=ID
  private reporteAbrir: number | null = null; // llega desde el dashboard con ?reporte=ID
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  colorRiesgo = colorRiesgo;
  claseEstadoReporte = claseEstadoReporte;
  textoEstadoReporte = textoEstadoReporte;
  vista: string = 'denunciados'; // denunciados | todos
  denunciados: Incidente[] = [];
  todos: Incidente[] = [];
  seleccionado: Incidente | null = null;
  zona: ZonaRiesgo | null = null;
  autor: Usuario | null = null;
  comentarios: Comentario[] = [];
  falsas: number = 0;
  confirmadas: number = 0;
  descartados: number = 0;
  verificados: number = 0;
  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.queryParamMap.get('reporte'));
    if (id > 0) {
      this.vista = 'todos';
      this.vistaElegida = true;
      this.reporteAbrir = id;
    }
    this.cargar();
    this.temporizador = setInterval(() => this.refrescar(), 10000);
  }

  // HU-32: los reportes se actualizan solos cada 10 segundos (NO VISTO EN CLASE: setInterval / ngOnDestroy)
  private temporizador: any;

  ngOnDestroy() {
    clearInterval(this.temporizador);
  }

  // Actualiza las listas sin mover el reporte que el administrador está revisando
  refrescar() {
    this.incidenteService.denunciados().subscribe({
      next: (lista) => {
        this.denunciados = lista;
        this.mantenerSeleccion();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.incidenteService.list().subscribe({
      next: (todos) => {
        this.todos = [...todos].sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''));
        this.descartados = todos.filter((i) => i.estado === 'ELIMINADO').length;
        this.verificados = todos.filter((i) => i.estado === 'VERIFICADO').length;
        this.mantenerSeleccion();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  // Si el reporte seleccionado sigue en la lista, solo se actualizan sus datos; si desapareció, se elige otro
  private mantenerSeleccion() {
    if (!this.seleccionado) {
      return;
    }
    const actual = this.lista.find((i) => i.id_incidente === this.seleccionado?.id_incidente);
    if (actual) {
      this.seleccionado = actual;
    } else {
      this.reseleccionar();
    }
  }

  cargar() {
    this.incidenteService.denunciados().subscribe({
      next: (lista) => {
        this.denunciados = lista;
        // Si no hay denunciados, se muestran todos los reportes para que el admin no vea la pantalla vacía
        if (lista.length === 0 && !this.vistaElegida) {
          this.vista = 'todos';
        }
        if (this.vista === 'denunciados') {
          this.reseleccionar();
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    // El administrador ve todos los reportes completos, no solo los denunciados
    this.incidenteService.list().subscribe({
      next: (todos) => {
        this.todos = [...todos].sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''));
        this.descartados = todos.filter((i) => i.estado === 'ELIMINADO').length;
        this.verificados = todos.filter((i) => i.estado === 'VERIFICADO').length;
        if (this.vista === 'todos') {
          this.reseleccionar();
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  get lista(): Incidente[] {
    return this.vista === 'todos' ? this.todos : this.denunciados;
  }

  cambiarVista(v: string) {
    this.vistaElegida = true;
    this.vista = v;
    this.seleccionado = null;
    this.reseleccionar();
  }

  private reseleccionar() {
    const lista = this.lista;
    if (this.reporteAbrir !== null) {
      const pedido = lista.find((i) => i.id_incidente === this.reporteAbrir);
      if (pedido) {
        this.reporteAbrir = null;
        this.seleccionar(pedido);
        this.cdr.markForCheck();
        return;
      }
    }
    const actual = this.seleccionado ? lista.find((i) => i.id_incidente === this.seleccionado?.id_incidente) : null;
    if (actual) {
      this.seleccionar(actual);
    } else if (lista.length > 0) {
      this.seleccionar(lista[0]);
    } else {
      this.seleccionado = null;
    }
    this.cdr.markForCheck();
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
    this.zona = null;
    this.comentarios = [];
    if (i.id_zona) {
      this.zonaService.listId(i.id_zona).subscribe({
        next: (z) => {
          this.zona = z;
          this.cdr.markForCheck();
        },
        error: () => {},
      });
    }
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
          textoConfirmar: 'Confirmar Descarte de Reporte',
          textoCancelar: 'Cancelar y Volver',
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
