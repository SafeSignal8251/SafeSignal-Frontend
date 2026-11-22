import { ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { EstadisticaService } from '../../../services/estadistica-service';
import { AlertaService } from '../../../services/alerta-service';
import { IncidenteService } from '../../../services/incidente-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { Alerta } from '../../../model/alerta';
import { Incidente } from '../../../model/incidente';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { claseEstadoReporte, colorRiesgo, hace, textoEstadoReporte } from '../../../core/utilidades';
import { CirculoMapa, MapaComponent, MarcadorMapa } from '../../compartido/mapa-component/mapa-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';
import { VerUbicacionDialogComponent } from '../../compartido/ver-ubicacion-dialog-component/ver-ubicacion-dialog-component';

// Una fila de la tabla "Incidencias en vivo": puede ser una alerta SOS o un reporte pendiente
interface FilaVivo {
  tipo: 'ALERTA' | 'REPORTE';
  id: number;
  codigo: string;
  titulo: string;
  detalle: string;
  ubicacion: string;
  distrito: string;
  estado: string;
  nivel: string;
  fecha: string;
  lat: number;
  lng: number;
}

@Component({
  imports: [
    FormsModule,
    RouterLink,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatPaginator,
    MatButton,
    MatIcon,
    MapaComponent,
  ],
  selector: 'app-dashboard-admin-component',
  styleUrl: './dashboard-admin-component.css',
  templateUrl: './dashboard-admin-component.html',
})
export class DashboardAdminComponent implements OnDestroy {
  auth: AuthService = inject(AuthService);
  estadisticaService: EstadisticaService = inject(EstadisticaService);
  alertaService: AlertaService = inject(AlertaService);
  incidenteService: IncidenteService = inject(IncidenteService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  router: Router = inject(Router);

  hace = hace;
  claseEstadoReporte = claseEstadoReporte;
  textoEstadoReporte = textoEstadoReporte;
  denunciados: number = 0; // reportes en la cola de moderación (los mismos que ve Moderación de Reportes)
  displayedColumns: string[] = ['id', 'tipo', 'ubicacion', 'estado', 'ver', 'despacho'];
  dataSource: MatTableDataSource<FilaVivo> = new MatTableDataSource();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  resumen: any = {};
  zonas: ZonaRiesgo[] = [];
  filas: FilaVivo[] = [];
  periodo: string = '0'; // 0 = hoy, 7, 30
  distrito: string = '';
  severidad: string = '';

  circulos: CirculoMapa[] = [];
  marcadores: MarcadorMapa[] = [];

  mensaje: string = '';
  error: string = '';
  // NO VISTO EN CLASE: setInterval / ngOnDestroy (el panel se refresca solo cada 10 segundos)
  private temporizador: any;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit() {
    this.cargar();
    this.temporizador = setInterval(() => this.cargar(), 10000);
  }

  ngOnDestroy() {
    clearInterval(this.temporizador);
  }

  cargar() {
    this.estadisticaService.dashboard(this.auth.usuarioId()).subscribe({
      next: (r) => {
        this.resumen = r;
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.incidenteService.denunciados().subscribe({
      next: (d) => {
        this.denunciados = d.length;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.zonaService.list().subscribe({
      next: (z) => {
        this.zonas = z;
        this.circulos = z.map((x) => ({ lat: x.latitud, lng: x.longitud, radio: x.radio_metros || 300, color: colorRiesgo(x.nivel_riesgo), etiqueta: x.nombre + ' (' + x.nivel_riesgo + ')' }));
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.alertaService.listPorEstado('ACTIVA').subscribe({
      next: (alertas) => {
        this.incidenteService.listPorEstado('PENDIENTE').subscribe({
          next: (incidentes) => {
            this.armarFilas(alertas, incidentes);
            this.cdr.markForCheck();
          },
          error: (e) => this.fallo(e),
        });
      },
      error: (e) => this.fallo(e),
    });
  }

  private armarFilas(alertas: Alerta[], incidentes: Incidente[]) {
    const deAlertas: FilaVivo[] = alertas.map((a) => ({
      tipo: 'ALERTA',
      id: a.id_alerta,
      codigo: '#SOS-' + a.id_alerta,
      titulo: a.tipo_alerta === 'SILENCIOSA' ? 'Alerta silenciosa' : 'Alerta SOS',
      detalle: a.origen === 'DISPOSITIVO' ? 'Botón físico' : 'App web',
      ubicacion: a.direccion || 'Ubicación GPS',
      distrito: '',
      estado: 'CRITICO',
      nivel: 'ALTO',
      fecha: a.fecha_hora,
      lat: a.latitud,
      lng: a.longitud,
    }));
    const deReportes: FilaVivo[] = incidentes.map((i) => ({
      tipo: 'REPORTE',
      id: i.id_incidente,
      codigo: '#REP-' + i.id_incidente,
      titulo: i.tipo_incidente,
      detalle: (i.descripcion ?? '').slice(0, 40),
      ubicacion: i.direccion || i.distrito,
      distrito: i.distrito,
      estado: i.estado, // PENDIENTE: el color y el texto salen del estado real del reporte
      nivel: i.nivel_riesgo,
      fecha: i.fecha_hora,
      lat: i.latitud,
      lng: i.longitud,
    }));
    this.filas = [...deAlertas, ...deReportes].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
    this.filtrar();
  }

  get distritos(): string[] {
    return [...new Set(this.filas.map((f) => f.distrito).filter((d) => !!d))];
  }

  filtrar() {
    const dias = Number(this.periodo);
    const desde = dias === 0 ? new Date().setHours(0, 0, 0, 0) : Date.now() - dias * 86400000;
    const lista = this.filas.filter(
      (f) =>
        (this.distrito === '' || f.distrito === this.distrito) &&
        (this.severidad === '' || f.nivel === this.severidad) &&
        (!f.fecha || new Date(f.fecha).getTime() >= desde)
    );
    this.dataSource.data = lista;
    this.dataSource._updateChangeSubscription();
    this.marcadores = lista
      .filter((f) => f.lat != null && f.lng != null)
      .map((f) => ({ lat: f.lat, lng: f.lng, color: f.tipo === 'ALERTA' ? '#c0392b' : '#e6a817', etiqueta: f.codigo + ' ' + f.titulo }));
    this.cdr.markForCheck();
  }

  cambiarPeriodo(p: string) {
    this.periodo = p;
    this.filtrar();
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }

  // HU-14: «Ver Ruta» muestra en un mapa el punto de la alerta para despachar la unidad
  verRuta(f: FilaVivo) {
    this.dialog.open(VerUbicacionDialogComponent, {
      width: '640px',
      data: { titulo: f.titulo, codigo: f.codigo, direccion: f.ubicacion, lat: f.lat, lng: f.lng },
    });
  }

  // Abre el reporte completo (descripción, autor, votos y comentarios) en Moderación de Reportes
  verReporte(f: FilaVivo) {
    this.router.navigate(['/admin/moderacion'], { queryParams: { reporte: f.id } });
  }

  accionPrincipal(f: FilaVivo) {
    if (f.tipo === 'ALERTA') {
      this.despachar(f);
    } else {
      this.validar(f);
    }
  }

  textoAccion(f: FilaVivo): string {
    return f.tipo === 'ALERTA' ? 'Despachar' : 'Validar';
  }

  private despachar(f: FilaVivo) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '460px',
        data: {
          titulo: 'Despachar unidad de emergencia',
          mensaje: 'Registra el código de la unidad que atenderá la alerta ' + f.codigo + '.',
          icono: 'local_police',
          pedirTexto: true,
          textoObligatorio: true,
          etiquetaTexto: 'Código de despacho (ej. SER-114)',
          textoConfirmar: 'Despachar',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.alertaService.despachar(f.id, r.texto).subscribe({
            next: () => {
              this.mensaje = 'Alerta ' + f.codigo + ' despachada (' + r.texto + ').';
              this.error = '';
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }

  private validar(f: FilaVivo) {
    this.incidenteService.moderar(f.id, false).subscribe({
      next: () => {
        this.mensaje = 'Reporte ' + f.codigo + ' validado.';
        this.error = '';
        this.cargar();
      },
      error: (e) => this.fallo(e),
    });
  }

  claseEstado(estado: string): string {
    return estado === 'CRITICO' ? 'badge-rojo' : 'badge-azul';
  }
  get zonasPorNivel() {
    return [...this.zonas].sort((a, b) => (a.nivel_riesgo === 'ALTO' ? -1 : 1) - (b.nivel_riesgo === 'ALTO' ? -1 : 1)).slice(0, 5);
  }
}
