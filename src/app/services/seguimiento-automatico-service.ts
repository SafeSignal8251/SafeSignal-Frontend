import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { SeguimientoService } from './seguimiento-service';
import { UbicacionService } from './ubicacion-service';
import { distanciaMetros, guardarPref, leerPref } from '../core/utilidades';

// Un lugar que el cliente marcó como zona segura (Casa, Trabajo...). Se guarda en este navegador.
export interface LugarSeguro {
  nombre: string;
  lat: number;
  lng: number;
  radio: number; // metros
}

// HU-23: inicia el seguimiento automáticamente cuando el cliente sale de una zona segura.
// NO VISTO EN CLASE: navigator.geolocation.watchPosition (sigue la ubicación mientras la app está abierta).
@Injectable({ providedIn: 'root' })
export class SeguimientoAutomaticoService {
  private auth: AuthService = inject(AuthService);
  private seguimientoService: SeguimientoService = inject(SeguimientoService);
  private ubicacionService: UbicacionService = inject(UbicacionService);

  private vigilancia: number | null = null;
  private dentro: boolean | null = null; // null = todavía no se sabe
  private iniciando: boolean = false;

  lugares(): LugarSeguro[] {
    const l = leerPref('lugares_seguros', []);
    return Array.isArray(l) ? l : [];
  }

  guardarLugares(lugares: LugarSeguro[]) {
    guardarPref('lugares_seguros', lugares);
    this.actualizar();
  }

  // Se llama al iniciar la app, al cambiar de pantalla y al guardar la configuración
  actualizar() {
    const debeEstarActivo =
      this.auth.estaLogueado() && leerPref('seguimiento_automatico', false) === true && this.lugares().length > 0;
    if (debeEstarActivo) {
      this.iniciar();
    } else {
      this.detener();
    }
  }

  private iniciar() {
    if (this.vigilancia !== null || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    // Con el modo ahorro de batería se acepta una posición menos reciente
    const maximumAge = leerPref('ahorro_bateria', false) === true ? 120000 : 15000;
    this.vigilancia = navigator.geolocation.watchPosition(
      (pos) => this.procesar(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { maximumAge, timeout: 30000 }
    );
  }

  private detener() {
    if (this.vigilancia !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.vigilancia);
    }
    this.vigilancia = null;
    this.dentro = null;
  }

  // Dentro de alguna zona segura = a menos de su radio de alguno de los lugares guardados
  estaDentro(lat: number, lng: number): boolean {
    return this.lugares().some((l) => distanciaMetros(lat, lng, l.lat, l.lng) <= l.radio);
  }

  private procesar(lat: number, lng: number) {
    const dentroAhora = this.estaDentro(lat, lng);
    if (this.dentro === true && !dentroAhora) {
      this.iniciarSeguimiento(lat, lng);
    }
    this.dentro = dentroAhora;
  }

  private iniciarSeguimiento(lat: number, lng: number) {
    if (this.iniciando) {
      return;
    }
    this.iniciando = true;
    const id = this.auth.usuarioId();
    this.seguimientoService.activos(id).subscribe({
      next: (activos) => {
        if (activos.length > 0) {
          this.iniciando = false;
          return;
        }
        const minutos = Number(leerPref('tiempo_monitoreo', 60));
        this.seguimientoService
          .insert(id, { destino: 'Salida de zona segura', tiempo_monitoreo: minutos > 0 ? minutos : 60 })
          .subscribe({
            next: (s) => {
              this.ubicacionService
                .insert(s.id_seguimiento, { latitud: lat, longitud: lng, precision_metros: 20 })
                .subscribe({ next: () => {}, error: () => {} });
              guardarPref('aviso_seguimiento_auto', new Date().toISOString());
              this.iniciando = false;
            },
            error: () => (this.iniciando = false),
          });
      },
      error: () => (this.iniciando = false),
    });
  }
}
