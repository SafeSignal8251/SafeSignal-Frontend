import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { AuthService } from '../../../services/auth-service';
import { IncidenteService } from '../../../services/incidente-service';
import { ComentarioService } from '../../../services/comentario-service';
import { ValidacionService } from '../../../services/validacion-service';
import { SuscripcionZonaService } from '../../../services/suscripcion-zona-service';
import { Incidente } from '../../../model/incidente';
import { Comentario } from '../../../model/comentario';
import { SuscripcionZona } from '../../../model/suscripcion-zona';
import { mensajeError } from '../../../core/mensajes';
import { claseEstadoReporte, colorRiesgo, hace, textoEstadoReporte } from '../../../core/utilidades';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';

@Component({
  imports: [RouterLink, FormsModule, MatButton, MapaComponent],
  selector: 'app-reportes-component',
  styleUrl: './reportes-component.css',
  templateUrl: './reportes-component.html',
})
export class ReportesComponent {
  auth: AuthService = inject(AuthService);
  incidenteService: IncidenteService = inject(IncidenteService);
  comentarioService: ComentarioService = inject(ComentarioService);
  validacionService: ValidacionService = inject(ValidacionService);
  suscripcionService: SuscripcionZonaService = inject(SuscripcionZonaService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  colorRiesgo = colorRiesgo;
  claseEstadoReporte = claseEstadoReporte;
  textoEstadoReporte = textoEstadoReporte;
  todos: Incidente[] = [];
  suscripciones: SuscripcionZona[] = [];
  pestana: string = 'todos'; // todos | mios
  texto: string = '';
  tipo: string = '';
  nivel: string = '';
  distrito: string = '';
  periodo: string = '';
  soloVerificados: boolean = false;

  seleccionado: Incidente | null = null;
  comentarios: Comentario[] = [];
  votosConfirmados: number = 0;
  votosFalsos: number = 0;
  nuevoComentario: string = '';

  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.todos = lista
          .filter((i) => i.estado !== 'ELIMINADO')
          .sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''));
        if (this.todos.length > 0) {
          this.seleccionar(this.todos[0]);
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.cargarSuscripciones();
  }

  private cargarSuscripciones() {
    this.suscripcionService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (s) => {
        this.suscripciones = s;
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

  // El autor no puede validar su propio reporte, y solo lo puede editar mientras no esté validado
  esMio(i: Incidente | null): boolean {
    return !!i && i.id_usuario === this.auth.usuarioId();
  }
  puedeEditar(i: Incidente | null): boolean {
    return this.esMio(i) && i?.estado === 'PENDIENTE' && !i?.validado;
  }

  get mios(): Incidente[] {
    return this.todos.filter((i) => i.id_usuario === this.auth.usuarioId());
  }
  get tipos(): string[] {
    return [...new Set(this.todos.map((i) => i.tipo_incidente).filter((t) => !!t))];
  }
  get distritos(): string[] {
    return [...new Set(this.todos.map((i) => i.distrito).filter((t) => !!t))];
  }

  get lista(): Incidente[] {
    const base = this.pestana === 'mios' ? this.mios : this.todos;
    const t = this.texto.trim().toLowerCase();
    const dias = Number(this.periodo);
    const desde = dias > 0 ? Date.now() - dias * 86400000 : 0;
    return base.filter(
      (i) =>
        (t === '' || ((i.tipo_incidente ?? '') + ' ' + (i.descripcion ?? '') + ' ' + (i.direccion ?? '') + ' ' + (i.distrito ?? '')).toLowerCase().includes(t)) &&
        (this.tipo === '' || i.tipo_incidente === this.tipo) &&
        (this.nivel === '' || i.nivel_riesgo === this.nivel) &&
        (this.distrito === '' || i.distrito === this.distrito) &&
        (!this.soloVerificados || i.estado === 'VERIFICADO') &&
        (desde === 0 || new Date(i.fecha_hora).getTime() >= desde)
    );
  }

  cambiarPestana(p: string) {
    this.pestana = p;
  }

  seleccionar(i: Incidente) {
    this.seleccionado = i;
    this.comentarios = [];
    this.votosConfirmados = 0;
    this.votosFalsos = 0;
    this.comentarioService.listPorIncidente(i.id_incidente).subscribe({
      next: (c) => {
        this.comentarios = c;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.contarVotos(i.id_incidente);
  }

  private contarVotos(id: number) {
    this.validacionService.contarVotos(id, 'CONFIRMADO').subscribe({
      next: (n) => {
        this.votosConfirmados = n;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.validacionService.contarVotos(id, 'FALSA_ALARMA').subscribe({
      next: (n) => {
        this.votosFalsos = n;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  votar(tipo: string) {
    if (!this.seleccionado) {
      return;
    }
    const id = this.seleccionado.id_incidente;
    this.validacionService.insert(id, this.auth.usuarioId(), tipo).subscribe({
      next: () => {
        this.mensaje = tipo === 'CONFIRMADO' ? 'Gracias, validaste este reporte.' : 'Registramos tu denuncia de falsa alarma.';
        this.error = '';
        this.contarVotos(id);
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  comentar() {
    if (!this.seleccionado || this.nuevoComentario.trim() === '') {
      return;
    }
    const id = this.seleccionado.id_incidente;
    this.comentarioService.insert(this.auth.usuarioId(), id, this.nuevoComentario.trim()).subscribe({
      next: () => {
        this.nuevoComentario = '';
        this.seleccionar(this.seleccionado as Incidente);
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  quitarSuscripcion(s: SuscripcionZona) {
    this.suscripcionService.delete(s.id_suscripcion).subscribe({
      next: () => this.cargarSuscripciones(),
      error: (e) => this.fallo(e),
    });
  }

  clase(nivel: string): string {
    return nivel === 'ALTO' ? 'badge-rojo' : nivel === 'MEDIO' ? 'badge-naranja' : 'badge-azul';
  }

  // El navegador permite "Guardar como PDF" desde el cuadro de impresión
  descargarPdf() {
    window.print();
  }
}
