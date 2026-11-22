import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario-service';
import { IncidenteService } from '../../../services/incidente-service';
import { Usuario } from '../../../model/usuario';
import { mensajeError } from '../../../core/mensajes';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [
    RouterLink, DatePipe, FormsModule, MatTable, MatSort, MatSortHeader, MatColumnDef, MatHeaderCell, MatHeaderCellDef,
    MatCell, MatCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatPaginator, MatButton,
  ],
  selector: 'app-gestion-usuarios-component',
  styleUrl: './gestion-usuarios-component.css',
  templateUrl: './gestion-usuarios-component.html',
})
export class GestionUsuariosComponent {
  usuarioService: UsuarioService = inject(UsuarioService);
  incidenteService: IncidenteService = inject(IncidenteService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['nombres', 'telefono', 'fecha_registro', 'estado'];
  dataSource: MatTableDataSource<Usuario> = new MatTableDataSource();
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  usuarios: Usuario[] = [];
  texto: string = '';
  estado: string = '';
  distrito: string = '';
  reputacion: string = '';
  // Reportes verificados y descartados de cada usuario: de ahí sale su reputación
  private conteo: { [id: number]: { verificados: number; descartados: number } } = {};
  seleccionado: Usuario | null = null;
  mensaje: string = '';
  error: string = '';

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.conteo = {};
        for (const i of lista) {
          const c = (this.conteo[i.id_usuario] ??= { verificados: 0, descartados: 0 });
          if (i.estado === 'VERIFICADO') { c.verificados++; }
          if (i.estado === 'ELIMINADO') { c.descartados++; }
        }
        this.filtrar();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.usuarioService.list().subscribe({
      next: (u) => {
        this.usuarios = u;
        if (this.seleccionado) {
          this.seleccionado = u.find((x) => x.id_usuario === this.seleccionado?.id_usuario) ?? null;
        }
        this.filtrar();
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

  get total(): number { return this.usuarios.length; }
  get activos(): number { return this.usuarios.filter((u) => u.estado === 'ACTIVA').length; }
  get suspendidos(): number { return this.usuarios.filter((u) => u.estado === 'SUSPENDIDA').length; }
  get administradores(): number { return this.usuarios.filter((u) => u.rol === 'ADMIN').length; }
  get distritos(): string[] { return [...new Set(this.usuarios.map((u) => u.distrito).filter((d) => !!d))]; }

  // Reputación: Alta (solo reportes verificados), Baja (más descartados que verificados), Media (el resto) o sin reportes
  reputacionDe(u: Usuario): string {
    const c = this.conteo[u.id_usuario];
    if (!c || c.verificados + c.descartados === 0) { return 'Sin historial'; }
    if (c.descartados === 0) { return 'Alta'; }
    return c.descartados > c.verificados ? 'Baja' : 'Media';
  }
  claseReputacion(r: string): string {
    return r === 'Alta' ? 'badge-verde' : r === 'Baja' ? 'badge-rojo' : r === 'Media' ? 'badge-naranja' : 'badge-gris';
  }

  filtrar() {
    const t = this.texto.trim().toLowerCase();
    this.dataSource.data = this.usuarios.filter(
      (u) =>
        (t === '' || (u.nombres + ' ' + u.apellidos + ' ' + u.dni + ' ' + u.correo).toLowerCase().includes(t)) &&
        (this.estado === '' || u.estado === this.estado) &&
        (this.distrito === '' || u.distrito === this.distrito) &&
        (this.reputacion === '' || this.reputacionDe(u) === this.reputacion)
    );
    this.dataSource._updateChangeSubscription();
  }

  seleccionar(u: Usuario) {
    this.seleccionado = u;
  }

  iniciales(u: Usuario): string {
    return ((u.nombres ?? '?').charAt(0) + (u.apellidos ?? '').charAt(0)).toUpperCase();
  }

  suspender(u: Usuario) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '520px',
        data: {
          titulo: 'Confirmar suspensión de cuenta',
          mensaje: 'La cuenta no podrá iniciar sesión ni emitir alertas mientras esté suspendida.',
          detalle: u.nombres + ' ' + u.apellidos + ' · DNI ' + u.dni,
          icono: 'block',
          peligro: true,
          tituloOpciones: 'Motivos tipificados de la sanción',
          opciones: ['Falsas alarmas reiteradas', 'Reportes malintencionados o spam', 'Suplantación de identidad', 'Otro motivo administrativo'],
          pedirTexto: true,
          textoObligatorio: false,
          etiquetaTexto: 'Observaciones del administrador (opcional)',
          tituloDuraciones: 'Duración de la suspensión',
          duraciones: ['30 días', '90 días', 'Permanente'],
          textoConfirmar: 'Confirmar suspensión inmediata',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          const motivo = r.motivo + ' (' + r.duracion + ')' + (r.texto ? ': ' + r.texto : '');
          this.usuarioService.suspender(u.id_usuario, motivo).subscribe({
            next: () => {
              this.mensaje = 'Cuenta de ' + u.nombres + ' suspendida.';
              this.error = '';
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }

  reactivar(u: Usuario) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '520px',
        data: {
          titulo: 'Confirmar reactivación de cuenta',
          mensaje: 'La cuenta volverá a estar activa y el usuario podrá iniciar sesión nuevamente.',
          detalle: u.nombres + ' ' + u.apellidos + ' · Motivo de suspensión: ' + (u.motivo_suspension || 'no registrado'),
          icono: 'lock_open',
          textoConfirmar: 'Confirmar reactivación de cuenta',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.usuarioService.reactivar(u.id_usuario).subscribe({
            next: () => {
              this.mensaje = 'Cuenta de ' + u.nombres + ' reactivada.';
              this.error = '';
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }
}
