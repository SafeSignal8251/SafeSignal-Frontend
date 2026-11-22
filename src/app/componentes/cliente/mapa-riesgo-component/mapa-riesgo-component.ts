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
import { colorRiesgo, distanciaMetros, hace, LIMA, leerPref, obtenerUbicacion } from '../../../core/utilidades';
import { BuscadorDirecciones, Direccion, GeocodificacionService } from '../../../services/geocodificacion-service';
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
  geo: GeocodificacionService = inject(GeocodificacionService);
  buscadorOrigen: BuscadorDirecciones = new BuscadorDirecciones(this.geo, () => this.cdr.markForCheck());
  buscadorDestino: BuscadorDirecciones = new BuscadorDirecciones(this.geo, () => this.cdr.markForCheck());

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
    // HU-50: con el modo ahorro de batería el mapa se actualiza menos seguido (60 s en vez de 15 s)
    this.refresco = setInterval(() => this.cargarMapa(), leerPref('ahorro_bateria', false) === true ? 60000 : 15000);
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
    if (this.filtro === 'alto' || this.filtro === 'medio' || this.filtro === 'bajo') {
      return this.incidentes.filter((i) => i.nivel_riesgo === this.filtro.toUpperCase());
    }
    if (this.filtro === 'recientes') {
      const desde = Date.now() - 6 * 3600000;
      return this.incidentes.filter((i) => i.fecha_hora && new Date(i.fecha_hora).getTime() >= desde);
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
    // HU-29: el filtro por nivel también aplica a las zonas dibujadas
    const zonasVisibles = ['alto', 'medio', 'bajo'].includes(this.filtro) ? this.zonas.filter((z) => z.nivel_riesgo === this.filtro.toUpperCase()) : this.zonas;
    this.circulos = zonasVisibles.map((z) => ({
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
      // Dirección real del punto (si no se encuentra, queda el texto anterior)
      this.geo.inversa(u.lat, u.lng).then((d) => {
        if (d) {
          this.rutaForm.patchValue({ origen: d.texto });
          this.cdr.markForCheck();
        }
      });
    });
  }

  // Clic en el mapa = punto de destino
  elegirDestino(p: { lat: number; lng: number }) {
    this.rutaForm.patchValue({ destino_latitud: p.lat, destino_longitud: p.lng });
    this.cdr.markForCheck();
    this.geo.inversa(p.lat, p.lng).then((d) => {
      this.rutaForm.patchValue({ destino: d ? d.texto : 'Punto marcado en el mapa' });
      this.cdr.markForCheck();
    });
  }

  // El usuario escribe el origen o el destino: se muestran sugerencias de OpenStreetMap
  escribirOrigen() {
    this.buscadorOrigen.escribir(this.rutaForm.get('origen')?.value ?? '');
  }
  escribirDestino() {
    this.buscadorDestino.escribir(this.rutaForm.get('destino')?.value ?? '');
  }
  elegirOrigenSugerido(s: Direccion) {
    this.rutaForm.patchValue({ origen: s.texto, origen_latitud: s.lat, origen_longitud: s.lng });
    this.buscadorOrigen.cerrar();
    this.cdr.markForCheck();
  }
  elegirDestinoSugerido(s: Direccion) {
    this.rutaForm.patchValue({ destino: s.texto, destino_latitud: s.lat, destino_longitud: s.lng });
    this.buscadorDestino.cerrar();
    this.cdr.markForCheck();
  }

  buscarRutas() {
    // HU-17: si no se indicó el origen, se usa la ubicación actual
    if (this.rutaForm.get('origen_latitud')?.value == null) {
      this.buscando = true;
      obtenerUbicacion().then((u) => {
        this.rutaForm.patchValue({ origen_latitud: u.lat, origen_longitud: u.lng, origen: this.rutaForm.value.origen || (u.real ? 'Mi ubicación actual' : 'Centro de Lima') });
        this.buscando = false;
        this.buscarRutas();
      });
      return;
    }
    if (this.rutaForm.invalid) {
      this.rutaForm.markAllAsTouched();
      this.error = 'Completa el origen y el destino: escribe una dirección y elige una sugerencia, usa "Actual" o haz clic en el mapa.';
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

  // HU-19: muestra el desvío recomendado en el mapa sin aceptarlo todavía
  verDesvio() {
    const alt = this.alternativa;
    if (!alt || alt.origen_latitud == null || alt.destino_latitud == null) {
      return;
    }
    this.linea = [
      [alt.origen_latitud, alt.origen_longitud],
      [alt.destino_latitud, alt.destino_longitud],
    ];
    this.marcadores = [
      ...this.marcadores,
      { lat: alt.destino_latitud, lng: alt.destino_longitud, color: '#1e9a5e', etiqueta: 'Desvío: ' + alt.destino },
    ];
    this.centro = [(alt.origen_latitud + alt.destino_latitud) / 2, (alt.origen_longitud + alt.destino_longitud) / 2];
    this.mensaje = 'Mostrando el desvío recomendado: ' + alt.nombre;
    this.cdr.markForCheck();
  }

  // HU-17: vuelve a elegir el destino
  modificarDestino() {
    this.rutaActiva = null;
    this.alternativa = null;
    this.avisoAlternativa = '';
    this.rutaForm.patchValue({ destino: '', destino_latitud: null, destino_longitud: null });
    this.dibujar();
    this.mensaje = 'Escribe una dirección de destino o haz clic en el mapa para marcarlo.';
    this.cdr.markForCheck();
  }

  // HU-21: guardar la ruta actual con un nombre elegido por el cliente
  guardarRuta() {
    const ruta = this.rutaActiva;
    if (!ruta) {
      return;
    }
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '460px',
        data: {
          titulo: 'Guardar ruta frecuente',
          mensaje: 'Ponle un nombre para reutilizarla después desde tus rutas guardadas.',
          detalle: ruta.origen + ' → ' + ruta.destino,
          icono: 'bookmark',
          pedirTexto: true,
          textoObligatorio: true,
          etiquetaTexto: 'Nombre de la ruta (ej. Casa - Trabajo)',
          textoConfirmar: 'Guardar',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r && r.texto) {
          this.rutaService.update(ruta.id_ruta, { ...ruta, nombre: r.texto }).subscribe({
            next: (guardada) => {
              this.rutaActiva = guardada;
              this.mensaje = 'Ruta guardada como «' + guardada.nombre + '».';
              this.error = '';
              this.cargarRutas();
              this.cdr.markForCheck();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
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
