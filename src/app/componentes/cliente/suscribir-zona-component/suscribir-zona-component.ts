import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { AuthService } from '../../../services/auth-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { SuscripcionZonaService } from '../../../services/suscripcion-zona-service';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';
import { distanciaMetros, LIMA, obtenerUbicacion } from '../../../core/utilidades';
import { MapaComponent } from '../../compartido/mapa-component/mapa-component';

@Component({
  imports: [FormsModule, MatButton, MapaComponent],
  selector: 'app-suscribir-zona-component',
  styleUrl: './suscribir-zona-component.css',
  templateUrl: './suscribir-zona-component.html',
})
export class SuscribirZonaComponent {
  auth: AuthService = inject(AuthService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  suscripcionService: SuscripcionZonaService = inject(SuscripcionZonaService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  // El asistente de 3 pasos se controla con una variable (sin MatStepper, que no vimos)
  paso: number = 1;

  zonas: ZonaRiesgo[] = [];
  idZona: number | null = null;
  latitud: number | null = null;
  longitud: number | null = null;
  radio: number = 500;
  etiqueta: string = '';
  centro: [number, number] = LIMA;

  categorias = [
    { clave: 'DELITOS_ALTO_IMPACTO', titulo: 'Delitos de alto impacto', detalle: 'Robo a mano armada, secuestros y agresiones graves.', activa: true },
    { clave: 'SOSPECHOSOS', titulo: 'Incidentes sospechosos y arrebatos', detalle: 'Merodeo, seguimiento y robo al paso.', activa: true },
    { clave: 'TRAFICO_PATRULLAJE', titulo: 'Tráfico y desvíos preventivos de patrullaje', detalle: 'Cierre de vías y operativos.', activa: false },
    { clave: 'FALSAS_ALARMAS', titulo: 'Falsas alarmas confirmadas o avisos comunitarios', detalle: 'Aclaraciones de reportes dudosos.', activa: false },
  ];

  push: boolean = true;
  whatsapp: boolean = true;
  correo: boolean = false;
  horaDesde: string = '18:00';
  horaHasta: string = '07:00';

  guardando: boolean = false;
  error: string = '';

  ngOnInit() {
    this.zonaService.listActivas().subscribe({
      next: (z) => {
        this.zonas = z;
        this.detectarZona();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.guardando = false;
    this.cdr.markForCheck();
  }

  get superficie(): string {
    return ((Math.PI * this.radio * this.radio) / 1_000_000).toFixed(2);
  }
  get circulos() {
    return this.latitud != null && this.longitud != null
      ? [{ lat: this.latitud, lng: this.longitud, radio: this.radio, color: '#2e75b6' }]
      : [];
  }
  get marcadores() {
    return this.latitud != null && this.longitud != null ? [{ lat: this.latitud, lng: this.longitud, color: '#1a3a5c', etiqueta: 'Punto central' }] : [];
  }
  get nombreZona(): string {
    const z = this.zonas.find((x) => x.id_zona === this.idZona);
    return z ? z.nombre : '—';
  }

  localizar() {
    obtenerUbicacion().then((u) => {
      this.poner(u.lat, u.lng);
      this.cdr.markForCheck();
    });
  }

  elegirEnMapa(p: { lat: number; lng: number }) {
    this.poner(p.lat, p.lng);
    this.cdr.markForCheck();
  }

  private poner(lat: number, lng: number) {
    this.latitud = lat;
    this.longitud = lng;
    this.centro = [lat, lng];
    this.detectarZona();
  }

  private detectarZona() {
    if (this.latitud == null || this.longitud == null || this.zonas.length === 0) {
      return;
    }
    let menor = Infinity;
    for (const z of this.zonas) {
      const d = distanciaMetros(this.latitud, this.longitud, z.latitud, z.longitud);
      if (d < menor) {
        menor = d;
        this.idZona = z.id_zona;
      }
    }
  }

  siguiente() {
    this.error = '';
    if (this.paso === 1 && this.latitud == null) {
      this.error = 'Marca el punto central: usa «Localizar» o haz clic en el mapa.';
      return;
    }
    if (this.paso === 1 && this.etiqueta.trim() === '') {
      this.error = 'Ponle un nombre a la geocerca (por ejemplo «Ruta Universidad»).';
      return;
    }
    if (this.paso === 2 && !this.categorias.some((c) => c.activa)) {
      this.error = 'Selecciona al menos una categoría de incidentes.';
      return;
    }
    this.paso++;
  }

  atras() {
    this.error = '';
    this.paso--;
  }

  guardar() {
    if (!this.push && !this.whatsapp && !this.correo) {
      this.error = 'Activa al menos un canal de recepción.';
      return;
    }
    this.guardando = true;
    this.error = '';
    this.suscripcionService
      .insert(this.auth.usuarioId(), this.idZona, {
        etiqueta: this.etiqueta.trim(),
        latitud: this.latitud as number,
        longitud: this.longitud as number,
        radio_metros: this.radio,
        categorias: this.categorias.filter((c) => c.activa).map((c) => c.clave).join(','),
        notificar_push: this.push,
        notificar_whatsapp_sms: this.whatsapp,
        notificar_correo: this.correo,
        hora_desde: this.horaDesde + ':00',
        hora_hasta: this.horaHasta + ':00',
      })
      .subscribe({
        next: () => this.router.navigate(['/reportes']),
        error: (e) => this.fallo(e),
      });
  }
}
