import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { IncidenteService } from '../../../services/incidente-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { Incidente } from '../../../model/incidente';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { DISTRITOS_LIMA, distanciaMetros, LIMA, obtenerUbicacion } from '../../../core/utilidades';
import { BuscadorDirecciones, Direccion, GeocodificacionService } from '../../../services/geocodificacion-service';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatButton, MatIcon, MapaComponent],
  selector: 'app-reporte-nuevo-edit-component',
  styleUrl: './reporte-nuevo-edit-component.css',
  templateUrl: './reporte-nuevo-edit-component.html',
})
export class ReporteNuevoEditComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  incidenteService: IncidenteService = inject(IncidenteService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  geo: GeocodificacionService = inject(GeocodificacionService);
  buscador: BuscadorDirecciones = new BuscadorDirecciones(this.geo, () => this.cdr.markForCheck());

  incidenteForm: FormGroup;
  edicion: boolean = false;
  bloqueado: boolean = false; // reporte ya validado: se puede ver pero no editar
  id: number = 0;
  zonas: ZonaRiesgo[] = [];
  zonaDetectada: ZonaRiesgo | null = null;
  centro: [number, number] = LIMA;
  marcadores: { lat: number; lng: number; color: string }[] = [];
  cargando: boolean = false;
  error: string = '';

  tipos = [
    { valor: 'Robo / Asalto a mano armada', detalle: 'Arma de fuego o blanca reportada', icono: 'warning' },
    { valor: 'Arrebato de celular', detalle: 'En marcha / paso rápido', icono: 'smartphone' },
    { valor: 'Intento de acoso', detalle: 'Espacio público o transporte', icono: 'front_hand' },
    { valor: 'Sospecha', detalle: 'Merodeo de viviendas / vehículos', icono: 'visibility' },
    { valor: 'Falla de alumbrado / Vía peligrosa', detalle: 'Punto ciego nocturno', icono: 'lightbulb' },
    { valor: 'Accidente vehicular', detalle: 'Colisión con o sin heridos', icono: 'car_crash' },
  ];
  niveles = [
    { valor: 'ALTO', titulo: 'RIESGO ALTO', detalle: 'Violencia inminente, armas o heridos presentes. Prioridad P1: despacho inmediato.' },
    { valor: 'MEDIO', titulo: 'RIESGO MEDIO', detalle: 'Robo sin violencia o aglomeraciones hostiles. Prioridad P2: intervención < 8 min.' },
    { valor: 'BAJO', titulo: 'PREVENTIVO / LEVE', detalle: 'Luminaria rota, bache severo o sospecha latente. Prioridad P3: patrullaje programado.' },
  ];
  distritos: string[] = DISTRITOS_LIMA;

  constructor() {
    this.incidenteForm = this.fb.group({
      id_incidente: [null],
      tipo_incidente: ['', Validators.required],
      nivel_riesgo: ['MEDIO', Validators.required],
      direccion: ['', Validators.required],
      distrito: ['', Validators.required],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  ngOnInit() {
    this.zonaService.list().subscribe({
      next: (z) => {
        this.zonas = z;
        this.detectarZona();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.route.params.subscribe((p) => {
      this.edicion = p['id'] != null;
      if (this.edicion) {
        this.id = Number(p['id']);
        this.incidenteService.listId(this.id).subscribe({
          next: (data: Incidente) => {
            this.incidenteForm.patchValue(data);
            // Un reporte ya validado (por vecinos o por el administrador) no se puede editar
            if (data.validado || data.estado !== 'PENDIENTE') {
              this.bloqueado = true;
              this.error = 'Este reporte ya fue validado y no se puede editar.';
            }
            // En edición solo se puede cambiar la descripción (regla del backend)
            for (const campo of ['tipo_incidente', 'nivel_riesgo', 'direccion', 'distrito', 'latitud', 'longitud']) {
              this.incidenteForm.get(campo)?.disable();
            }
            this.ubicar(data.latitud, data.longitud);
            this.cdr.markForCheck();
          },
          error: (e) => this.fallo(e),
        });
      }
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  get caracteres(): number {
    return (this.incidenteForm.get('descripcion')?.value ?? '').length;
  }

  elegir(campo: string, valor: string) {
    if (!this.edicion) {
      this.incidenteForm.get(campo)?.setValue(valor);
    }
  }

  usarGps() {
    obtenerUbicacion().then((u) => {
      this.incidenteForm.patchValue({ latitud: u.lat, longitud: u.lng });
      if (!this.incidenteForm.value.direccion) {
        this.incidenteForm.patchValue({ direccion: u.real ? 'Ubicación GPS actual' : u.aproximada ? 'Ubicación aproximada' : 'Centro de Lima' });
      }
      this.ubicar(u.lat, u.lng);
      this.cdr.markForCheck();
      this.completarDireccion(u.lat, u.lng);
    });
  }

  elegirEnMapa(p: { lat: number; lng: number }) {
    if (this.edicion) {
      return;
    }
    this.incidenteForm.patchValue({ latitud: p.lat, longitud: p.lng });
    this.ubicar(p.lat, p.lng);
    this.cdr.markForCheck();
    this.completarDireccion(p.lat, p.lng);
  }

  // Busca la dirección real del punto y la escribe en el formulario (si no se encuentra, se deja lo anterior)
  private completarDireccion(lat: number, lng: number) {
    this.geo.inversa(lat, lng).then((d) => {
      if (d) {
        this.incidenteForm.patchValue({ direccion: d.texto });
        if (d.distrito) {
          this.incidenteForm.patchValue({ distrito: d.distrito });
        }
        this.cdr.markForCheck();
      }
    });
  }

  // El usuario escribe una dirección: se muestran sugerencias de OpenStreetMap
  escribirDireccion() {
    if (!this.edicion) {
      this.buscador.escribir(this.incidenteForm.get('direccion')?.value ?? '');
    }
  }

  elegirSugerencia(s: Direccion) {
    this.incidenteForm.patchValue({ direccion: s.texto, latitud: s.lat, longitud: s.lng });
    if (s.distrito) {
      this.incidenteForm.patchValue({ distrito: s.distrito });
    }
    this.buscador.cerrar();
    this.ubicar(s.lat, s.lng);
    this.cdr.markForCheck();
  }

  private ubicar(lat: number, lng: number) {
    if (lat == null || lng == null) {
      return;
    }
    this.centro = [lat, lng];
    this.marcadores = [{ lat, lng, color: '#c0392b' }];
    this.detectarZona();
  }

  // El backend necesita la zona de riesgo del incidente: se toma la más cercana a las coordenadas
  private detectarZona() {
    const lat = this.incidenteForm.getRawValue().latitud;
    const lng = this.incidenteForm.getRawValue().longitud;
    if (lat == null || lng == null || this.zonas.length === 0) {
      return;
    }
    let mejor: ZonaRiesgo | null = null;
    let menor = Infinity;
    for (const z of this.zonas) {
      const d = distanciaMetros(lat, lng, z.latitud, z.longitud);
      if (d < menor) {
        menor = d;
        mejor = z;
      }
    }
    this.zonaDetectada = mejor;
  }

  onSubmit() {
    if (this.incidenteForm.invalid) {
      this.incidenteForm.markAllAsTouched();
      this.error = 'Completa los campos obligatorios del reporte.';
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.incidenteForm.getRawValue();
    if (this.edicion) {
      if (this.bloqueado) {
        this.cargando = false;
        return;
      }
      this.incidenteService.update(this.id, this.auth.usuarioId(), v.descripcion).subscribe({
        next: () => this.router.navigate(['/reportes']),
        error: (e) => this.fallo(e),
      });
      return;
    }
    const incidente: Partial<Incidente> = {
      tipo_incidente: v.tipo_incidente,
      nivel_riesgo: v.nivel_riesgo,
      descripcion: v.descripcion,
      direccion: v.direccion,
      distrito: v.distrito,
      latitud: v.latitud,
      longitud: v.longitud,
    };
    this.incidenteService.insert(this.zonaDetectada?.id_zona ?? null, this.auth.usuarioId(), incidente).subscribe({
      next: () => this.router.navigate(['/reportes']),
      error: (e) => this.fallo(e),
    });
  }
}
