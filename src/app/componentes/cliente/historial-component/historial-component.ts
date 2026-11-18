import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { AlertaService } from '../../../services/alerta-service';
import { NotificacionService } from '../../../services/notificacion-service';
import { Alerta } from '../../../model/alerta';
import { Notificacion } from '../../../model/notificacion';
import { mensajeError } from '../../../core/mensajes';
import { MapaComponent, MarcadorMapa } from '../../compartido/mapa-component/mapa-component';

@Component({
  imports: [
    FormsModule, DatePipe, DecimalPipe, MatTable, MatSort, MatSortHeader, MatColumnDef, MatHeaderCell, MatHeaderCellDef,
    MatCell, MatCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatPaginator, MatButton, MatIcon, MapaComponent,
  ],
  selector: 'app-historial-component',
  styleUrl: './historial-component.css',
  templateUrl: './historial-component.html',
})
export class HistorialComponent {
  auth: AuthService = inject(AuthService);
  alertaService: AlertaService = inject(AlertaService);
  notificacionService: NotificacionService = inject(NotificacionService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['id_alerta', 'fecha_hora', 'direccion', 'estado'];
  dataSource: MatTableDataSource<Alerta> = new MatTableDataSource();
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  alertas: Alerta[] = [];
  texto: string = '';
  estado: string = '';
  periodo: string = '';
  seleccionada: Alerta | null = null;
  notificados: Notificacion[] = [];
  marcadores: MarcadorMapa[] = [];
  error: string = '';

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.alertaService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (data) => {
        this.alertas = [...data].sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''));
        this.filtrar();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  get totalSos(): number {
    return this.alertas.filter((a) => a.tipo_alerta === 'SOS').length;
  }
  get totalSilenciosas(): number {
    return this.alertas.filter((a) => a.tipo_alerta === 'SILENCIOSA').length;
  }
  get totalCanceladas(): number {
    return this.alertas.filter((a) => a.estado === 'CANCELADA').length;
  }
  get totalDespachadas(): number {
    return this.alertas.filter((a) => a.estado === 'DESPACHADA').length;
  }

  filtrar() {
    const t = this.texto.trim().toLowerCase();
    const dias = Number(this.periodo);
    const desde = dias > 0 ? Date.now() - dias * 86400000 : 0;
    const lista = this.alertas.filter((a) => {
      const cadena = ('ALT-' + a.id_alerta + ' ' + (a.direccion ?? '') + ' ' + a.tipo_alerta).toLowerCase();
      return (
        (t === '' || cadena.includes(t)) &&
        (this.estado === '' || a.estado === this.estado) &&
        (desde === 0 || new Date(a.fecha_hora).getTime() >= desde)
      );
    });
    this.dataSource.data = lista;
    this.dataSource._updateChangeSubscription();
  }

  limpiar() {
    this.texto = '';
    this.estado = '';
    this.periodo = '';
    this.filtrar();
  }

  seleccionar(a: Alerta) {
    this.seleccionada = a;
    this.marcadores = a.latitud != null ? [{ lat: a.latitud, lng: a.longitud, color: '#c0392b', etiqueta: a.tipo_alerta }] : [];
    this.notificados = [];
    this.notificacionService.listPorAlerta(a.id_alerta).subscribe({
      next: (n) => {
        this.notificados = n;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  claseEstado(estado: string): string {
    if (estado === 'ACTIVA') { return 'badge-rojo'; }
    if (estado === 'DESPACHADA') { return 'badge-azul'; }
    if (estado === 'CANCELADA') { return 'badge-gris'; }
    return 'badge-verde';
  }
  textoEstado(estado: string): string {
    if (estado === 'ACTIVA') { return 'Activa'; }
    if (estado === 'DESPACHADA') { return 'Atendida por Serenazgo'; }
    if (estado === 'CANCELADA') { return 'Cancelada por ti'; }
    return estado;
  }
}
