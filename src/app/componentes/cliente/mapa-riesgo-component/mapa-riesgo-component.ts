import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { IncidenteService } from '../../../services/incidente-service';
import { RutaService } from '../../../services/ruta-service';
import { SeguimientoService } from '../../../services/seguimiento-service';
import { Incidente } from '../../../model/incidente';
import { Ruta } from '../../../model/ruta';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { colorRiesgo, distanciaMetros, hace, LIMA, obtenerUbicacion } from '../../../core/utilidades';
import { CirculoMapa, MapaComponent, MarcadorMapa } from '../../compartido/mapa-component/mapa-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, MatButton, MatIcon, MapaComponent],
  selector: 'app-mapa-riesgo-component',
  styleUrl: './mapa-riesgo-component.css',
  templateUrl: './mapa-riesgo-component.html',
})
export class MapaRiesgoComponent implements OnInit, OnDestroy {
  // HU-25: el mapa se actualiza solo cada 15 segundos mientras la pantalla está abierta
  private refresco: ReturnType<typeof setInterval> | null = null;

  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  incidenteService: IncidenteService = inject(IncidenteService);
  rutaService: RutaService = inject(RutaService);
  seguimientoService: SeguimientoService = inject(SeguimientoService);
  dialog: MatDialog = inject(MatDialog);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  hace = hace;
  rutaForm: FormGroup;
  zonas: ZonaRiesgo[] = [];
  incidentes: Incidente[] = [];
  rutas: Ruta[] = [];
  riesgos: { [id: number]: any } = {};

  filtro: string = 'todos'; // todos | alto | robo
  rutaActiva: Ruta | null = null;
  alternativa: Ruta | null = null;
  avisoAlternativa: string = '';
  buscando: boolean = false;

  circulos: CirculoMapa[] = [];
  marcadores: MarcadorMapa[] = [];
  linea: [number, number][] = [];
  centro: [number, number] = LIMA;

  mensaje: string = '';
  error: string = '';

  constructor() {
    this.rutaForm = this.fb.group({
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      origen_latitud: [null, Validators.required],
      origen_longitud: [null, Validators.required],
      destino_latitud: [null, Validators.required],
      destino_longitud: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.cargar();
    this.refresco = setInterval(() => this.cargarMapa(), 15000);
  }

  ngOnDestroy() {
    if (this.refresco) {
      clearInterval(this.refresco);
    }
  }

  // Solo zonas e incidentes (no vuelve a calcular las rutas guardadas)
  private cargarMapa() {
    this.zonaService.listActivas().subscribe({
      next: (z) => {
        this.zonas = z;
        this.dibujar();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.incidentes = lista.filter((i) => i.estado !== 'ELIMINADO');
        this.dibujar();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  cargar() {
    this.zonaService.listActivas().subscribe({
      next: (z) => {
        this.zonas = z;
        this.dibujar();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.incidentes = lista.filter((i) => i.estado !== 'ELIMINADO');
        this.dibujar();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.cargarRutas();
  }

  private cargarRutas() {
    this.rutaService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (r) => {
        this.rutas = r;
        // Se evalúa el riesgo de cada ruta guardada (máximo 8)
        for (const ruta of r.slice(0, 8)) {
          this.rutaService.evaluarRiesgo(ruta.id_ruta).subscribe({
            next: (x) => {
              this.riesgos[ruta.id_ruta] = x;
              this.cdr.markForCheck();
            },
            error: () => {},
          });
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  get incidentesFiltrados(): Incidente[] {
    if (this.filtro === 'alto') {
      return this.incidentes.filter((i) => i.nivel_riesgo === 'ALTO');
    }
    if (this.filtro === 'robo') {
      return this.incidentes.filter((i) => /ROBO|ASALTO/i.test(i.tipo_incidente ?? ''));
    }
    return this.incidentes;
  }

  get cercanos(): Incidente[] {
    return [...this.incidentes].sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? '')).slice(0, 4);
  }

  get zonasAltas(): number {
    return this.zonas.filter((z) => z.nivel_riesgo === 'ALTO').length;
  }

  cambiarFiltro(f: string) {
    this.filtro = f;
    this.dibujar();
  }

  private dibujar() {
    this.circulos = this.zonas.map((z) => ({
      lat: z.latitud,
      lng: z.longitud,
      radio: z.radio_metros || 300,
      color: colorRiesgo(z.nivel_riesgo),
      etiqueta: z.nombre + ' (' + z.nivel_riesgo + ')',
    }));
    this.marcadores = this.incidentesFiltrados
      .filter((i) => i.latitud != null && i.longitud != null)
      .slice(0, 60)
      .map((i) => ({ lat: i.latitud, lng: i.longitud, color: colorRiesgo(i.nivel_riesgo), etiqueta: i.tipo_incidente }));
    const ruta = this.rutaActiva;
    if (ruta && ruta.origen_latitud != null && ruta.destino_latitud != null) {
      this.linea = [
        [ruta.origen_latitud, ruta.origen_longitud],
        [ruta.destino_latitud, ruta.destino_longitud],
      ];
      this.marcadores = [
        ...this.marcadores,
        { lat: ruta.origen_latitud, lng: ruta.origen_longitud, color: '#2e75b6', etiqueta: 'Origen: ' + ruta.origen },
        { lat: ruta.destino_latitud, lng: ruta.destino_longitud, color: '#1a3a5c', etiqueta: 'Destino: ' + ruta.destino },
      ];
      this.centro = [(ruta.origen_latitud + ruta.destino_latitud) / 2, (ruta.origen_longitud + ruta.destino_longitud) / 2];
    } else {
      this.linea = [];
    }
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.buscando = false;
    this.cdr.markForCheck();
  }

  // ----- Cálculo de ruta segura -----
  usarMiUbicacion() {
    obtenerUbicacion().then((u) => {
      this.rutaForm.patchValue({ origen_latitud: u.lat, origen_longitud: u.lng });
      if (!this.rutaForm.value.origen) {
        this.rutaForm.patchValue({ origen: u.real ? 'Mi ubicación actual' : 'Centro de Lima' });
      }
      this.cdr.markForCheck();
    });
  }

  // Clic en el mapa = punto de destino
  elegirDestino(p: { lat: number; lng: number }) {
    this.rutaForm.patchValue({ destino_latitud: p.lat, destino_longitud: p.lng });
    this.cdr.markForCheck();
  }

  buscarRutas() {
    if (this.rutaForm.invalid) {
      this.rutaForm.markAllAsTouched();
      this.error = 'Completa el origen y el destino. Usa "Actual" para tu ubicación y haz clic en el mapa para marcar el destino.';
      return;
    }
    this.buscando = true;
    this.error = '';
    this.mensaje = '';
    this.alternativa = null;
    this.avisoAlternativa = '';
    const v = this.rutaForm.value;
    const km = distanciaMetros(v.origen_latitud, v.origen_longitud, v.destino_latitud, v.destino_longitud) / 1000;
    const nueva: Partial<Ruta> = {
      nombre: v.origen + ' → ' + v.destino,
      origen: v.origen,
      destino: v.destino,
      origen_latitud: v.origen_latitud,
      origen_longitud: v.origen_longitud,
      destino_latitud: v.destino_latitud,
      destino_longitud: v.destino_longitud,
      distancia: Math.round(km * 10) / 10,
      tiempo_estimado: Math.max(1, Math.round((km / 5) * 60)), // caminando a 5 km/h
      tipo_ruta: 'PEATONAL',
    };
    this.rutaService.insert(this.auth.usuarioId(), nueva).subscribe({
      next: (ruta) => {
        this.rutaActiva = ruta;
        this.rutaService.evaluarRiesgo(ruta.id_ruta).subscribe({
          next: (r) => {
            this.riesgos[ruta.id_ruta] = r;
            this.buscando = false;
            if (r.nivel_riesgo !== 'BAJO') {
              this.rutaService.alternativa(ruta.id_ruta).subscribe({
                next: (alt) => {
                  this.alternativa = alt;
                  this.cdr.markForCheck();
                },
                error: (e) => {
                  this.avisoAlternativa = mensajeError(e);
                  this.cdr.markForCheck();
                },
              });
            }
            this.dibujar();
            this.cargarRutas();
            this.cdr.markForCheck();
          },
          error: (e) => this.fallo(e),
        });
      },
      error: (e) => this.fallo(e),
    });
  }

  usarRuta(ruta: Ruta) {
    this.rutaActiva = ruta;
    this.alternativa = null;
    this.avisoAlternativa = '';
    this.dibujar();
    this.cdr.markForCheck();
  }

  aceptarAlternativa() {
    if (this.alternativa) {
      this.usarRuta(this.alternativa);
      this.mensaje = 'Ruta segura aceptada: ' + this.alternativa.nombre;
    }
  }

  iniciarTrayecto() {
    if (!this.rutaActiva) {
      return;
    }
    const minutos = this.rutaActiva.tiempo_estimado > 0 ? this.rutaActiva.tiempo_estimado : 30;
    this.seguimientoService
      .insert(this.auth.usuarioId(), { destino: this.rutaActiva.destino, tiempo_monitoreo: minutos })
      .subscribe({
        next: () => {
          this.mensaje = 'Trayecto seguro iniciado: seguimiento activo por ' + minutos + ' minutos.';
          this.error = '';
          this.cdr.markForCheck();
        },
        error: (e) => this.fallo(e),
      });
  }

  eliminarRuta(ruta: Ruta) {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '440px',
        data: {
          titulo: '¿Eliminar ruta guardada?',
          mensaje: 'Se eliminará la ruta de tus rutas frecuentes.',
          detalle: ruta.nombre,
          peligro: true,
          icono: 'delete',
          textoConfirmar: 'Eliminar ruta',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.rutaService.delete(ruta.id_ruta).subscribe({
            next: () => {
              if (this.rutaActiva && this.rutaActiva.id_ruta === ruta.id_ruta) {
                this.rutaActiva = null;
                this.dibujar();
              }
              this.cargarRutas();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }

  riesgoDe(id: number): string {
    return this.riesgos[id] ? this.riesgos[id].nivel_riesgo : '';
  }
  clase(nivel: string): string {
    return nivel === 'ALTO' ? 'badge-rojo' : nivel === 'MEDIO' ? 'badge-naranja' : 'badge-verde';
  }
}
