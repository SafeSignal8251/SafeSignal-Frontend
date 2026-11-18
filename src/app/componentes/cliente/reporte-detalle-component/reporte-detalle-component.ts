import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { IncidenteService } from '../../../services/incidente-service';
import { ComentarioService } from '../../../services/comentario-service';
import { ValidacionService } from '../../../services/validacion-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { Incidente } from '../../../model/incidente';
import { Comentario } from '../../../model/comentario';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { colorRiesgo, hace } from '../../../core/utilidades';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';

@Component({
  imports: [RouterLink, DatePipe, FormsModule, MatButton, MatIcon, MapaComponent],
  selector: 'app-reporte-detalle-component',
  styleUrl: './reporte-detalle-component.css',
  templateUrl: './reporte-detalle-component.html',
})
export class ReporteDetalleComponent {
  auth: AuthService = inject(AuthService);
  route: ActivatedRoute = inject(ActivatedRoute);
  incidenteService: IncidenteService = inject(IncidenteService);
  comentarioService: ComentarioService = inject(ComentarioService);
  validacionService: ValidacionService = inject(ValidacionService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  colorRiesgo = colorRiesgo;
  incidente: Incidente | null = null;
  zona: ZonaRiesgo | null = null;
  comentarios: Comentario[] = [];
  votosConfirmados: number = 0;
  votosFalsos: number = 0;
  nuevoComentario: string = '';
  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.route.params.subscribe((p) => {
      const id = Number(p['id']);
      this.incidenteService.listId(id).subscribe({
        next: (i) => {
          this.incidente = i;
          if (i.id_zona) {
            this.zonaService.listId(i.id_zona).subscribe({
              next: (z) => {
                this.zona = z;
                this.cdr.markForCheck();
              },
              error: () => {},
            });
          }
          this.cdr.markForCheck();
        },
        error: (e) => this.fallo(e),
      });
      this.cargarComentarios(id);
      this.contarVotos(id);
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }

  private cargarComentarios(id: number) {
    this.comentarioService.listPorIncidente(id).subscribe({
      next: (c) => {
        this.comentarios = c;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
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
    if (!this.incidente) {
      return;
    }
    const id = this.incidente.id_incidente;
    this.validacionService.insert(id, this.auth.usuarioId(), tipo).subscribe({
      next: () => {
        this.mensaje = tipo === 'CONFIRMADO' ? 'Gracias, validaste este reporte.' : 'Registramos tu denuncia de inconsistencia.';
        this.error = '';
        this.contarVotos(id);
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  comentar() {
    if (!this.incidente || this.nuevoComentario.trim() === '') {
      return;
    }
    const id = this.incidente.id_incidente;
    this.comentarioService.insert(this.auth.usuarioId(), id, this.nuevoComentario.trim()).subscribe({
      next: () => {
        this.nuevoComentario = '';
        this.cargarComentarios(id);
      },
      error: (e) => this.fallo(e),
    });
  }

  get porcentajeVeracidad(): number {
    const total = this.votosConfirmados + this.votosFalsos;
    return total === 0 ? 0 : Math.round((this.votosConfirmados / total) * 100);
  }

  clase(nivel: string): string {
    return nivel === 'ALTO' ? 'badge-rojo' : nivel === 'MEDIO' ? 'badge-naranja' : 'badge-azul';
  }
}
