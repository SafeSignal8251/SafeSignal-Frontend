import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../../services/auth-service';
import { SeguimientoService } from '../../../services/seguimiento-service';
import { UbicacionService } from '../../../services/ubicacion-service';
import { Seguimiento } from '../../../model/seguimiento';
import { Ubicacion } from '../../../model/ubicacion';
import { mensajeError } from '../../../core/mensajes';
import { LIMA, leerPref, obtenerUbicacion } from '../../../core/utilidades';
import { MapaComponent, MarcadorMapa } from '../../compartido/mapa-component/mapa-component';

// HU-10 / HU-27: seguimiento activo con el mapa en vivo y los botones «Finalizar» y «Llegué con seguridad»
@Component({
  imports: [RouterLink, DatePipe, MatButton, MapaComponent],
  selector: 'app-seguimiento-component',
  styleUrl: './seguimiento-component.css',
  templateUrl: './seguimiento-component.html',
})
export class SeguimientoComponent implements OnInit, OnDestroy {
  auth: AuthService = inject(AuthService);
  seguimientoService: SeguimientoService = inject(SeguimientoService);
  ubicacionService: UbicacionService = inject(UbicacionService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  seguimiento: Seguimiento | null = null;
  ultima: Ubicacion | null = null;
  cargando: boolean = true;
  restante: string = '';
  demorado: boolean = false;
  centro: [number, number] = LIMA;
  marcadores: MarcadorMapa[] = [];
  mensaje: string = '';
  error: string = '';

  private reloj: ReturnType<typeof setInterval> | null = null;
  private envio: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.cargar();
    this.reloj = setInterval(() => this.calcularRestante(), 1000);
    // Cada cuánto se envía la ubicación: el modo ahorro de batería (HU-50) lo espacia a 60 s
    const cada = leerPref('ahorro_bateria', false) === true ? 60000 : 15000;
    this.envio = setInterval(() => this.enviarUbicacion(), cada);
  }

  ngOnDestroy() {
    if (this.reloj) {
      clearInterval(this.reloj);
    }
    if (this.envio) {
      clearInterval(this.envio);
    }
  }

  private cargar() {
    this.seguimientoService.activos(this.auth.usuarioId()).subscribe({
      next: (lista) => {
        this.seguimiento = lista[0] ?? null;
        this.cargando = false;
        this.calcularRestante();
        if (this.seguimiento) {
          this.cargarUltima();
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private cargarUltima() {
    if (!this.seguimiento) {
      return;
    }
    this.ubicacionService.ultima(this.seguimiento.id_seguimiento).subscribe({
      next: (u) => {
        this.ultima = u;
        if (u && u.latitud != null) {
          this.centro = [u.latitud, u.longitud];
          this.marcadores = [{ lat: u.latitud, lng: u.longitud, color: '#2e75b6', etiqueta: 'Tu ubicación' }];
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  // Envía la ubicación actual mientras el seguimiento sigue activo
  private enviarUbicacion() {
    if (!this.seguimiento) {
      return;
    }
    const id = this.seguimiento.id_seguimiento;
    obtenerUbicacion().then((u) => {
      this.ubicacionService.insert(id, { latitud: u.lat, longitud: u.lng, precision_metros: 20 }).subscribe({
        next: () => this.cargarUltima(),
        error: () => {},
      });
    });
  }

  private calcularRestante() {
    if (!this.seguimiento) {
      return;
    }
    const fin = new Date(this.seguimiento.fecha_inicio).getTime() + this.seguimiento.tiempo_monitoreo * 60000;
    const falta = fin - Date.now();
    this.demorado = falta < 0;
    const abs = Math.abs(falta);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    this.restante = (h > 0 ? h + ' h ' : '') + m + ' min ' + (s < 10 ? '0' : '') + s + ' s';
    this.cdr.markForCheck();
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  // «Finalizar» y «Llegué con seguridad» cierran el seguimiento; el segundo avisa que el trayecto terminó bien
  finalizar(llegueConSeguridad: boolean) {
    if (!this.seguimiento) {
      return;
    }
    this.seguimientoService.finalizar(this.seguimiento.id_seguimiento).subscribe({
      next: () => {
        this.seguimiento = null;
        this.marcadores = [];
        this.mensaje = llegueConSeguridad ? '¡Qué bueno! Registramos que llegaste con seguridad.' : 'Seguimiento finalizado.';
        this.error = '';
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }
}
