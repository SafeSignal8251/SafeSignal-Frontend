import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { AuthService } from '../../../services/auth-service';
import { UsuarioService } from '../../../services/usuario-service';
import { DispositivoService } from '../../../services/dispositivo-service';
import { DispositivoIoT } from '../../../model/dispositivo-iot';
import { mensajeError } from '../../../core/mensajes';
import { guardarPref, leerPref, obtenerUbicacion } from '../../../core/utilidades';
import { LugarSeguro, SeguimientoAutomaticoService } from '../../../services/seguimiento-automatico-service';

@Component({
  imports: [RouterLink, FormsModule, MatButton],
  selector: 'app-configuracion-component',
  styleUrl: './configuracion-component.css',
  templateUrl: './configuracion-component.html',
})
export class ConfiguracionComponent {
  auth: AuthService = inject(AuthService);
  usuarioService: UsuarioService = inject(UsuarioService);
  dispositivoService: DispositivoService = inject(DispositivoService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  seguimientoAuto: SeguimientoAutomaticoService = inject(SeguimientoAutomaticoService);

  // ---- Lugares seguros (HU-23) ----
  lugares: LugarSeguro[] = [];
  nombreLugar: string = '';
  radioLugar: number = 200;

  // ---- Mensaje SOS (se guarda en el backend) ----
  readonly maxMensaje: number = 200;
  mensajeSos: string = '';
  mensajeGuardado: boolean = false;

  // ---- Preferencias que el backend no guarda (quedan en este navegador) ----
  horas: number = 0;
  minutos: number = 35;
  seguimientoAutomatico: boolean = false;
  ahorroBateria: boolean = false;
  alarmaSilenciosa: boolean = false;

  // ---- Dispositivos y anomalías (se guardan en el backend) ----
  dispositivos: DispositivoIoT[] = [];
  habilitados: { [id: number]: boolean } = {};
  anomalias = [
    { clave: 'DESVIO_RUTA', titulo: 'Desviación imprevista de la ruta habitual', detalle: 'Notifica cuando el trayecto cambia más de 400 m de la ruta calculada', activa: false },
    { clave: 'DETENCION_ZONA_RIESGO', titulo: 'Detención prolongada en zona de riesgo alto', detalle: 'Dispara alerta si la inmovilidad supera los 4 minutos en puntos críticos', activa: false },
    { clave: 'PERDIDA_SENAL', titulo: 'Pérdida súbita de señal en trayecto nocturno', detalle: 'Reporta a contactos si el terminal se desconecta repentinamente', activa: false },
    { clave: 'VELOCIDAD_ALTA', titulo: 'Movimiento a velocidad anormalmente alta', detalle: 'Aceleración vehicular no prevista durante trayecto a pie', activa: false },
  ];

  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    const id = this.auth.usuarioId();
    this.usuarioService.listId(id).subscribe({
      next: (u) => {
        this.mensajeSos = u.mensaje_sos || '';
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.dispositivoService.listPorUsuario(id).subscribe({
      next: (d) => {
        this.dispositivos = d;
        for (const x of d) {
          this.habilitados[x.id_dispositivo] = x.estado === 'HABILITADO';
        }
        const tipos = (d[0]?.tipos_anomalia ?? '').split(',').map((t) => t.trim());
        for (const a of this.anomalias) {
          a.activa = tipos.includes(a.clave);
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    const total = Number(leerPref('tiempo_monitoreo', 35));
    this.horas = Math.floor(total / 60);
    this.minutos = total % 60;
    this.seguimientoAutomatico = leerPref('seguimiento_automatico', false);
    this.ahorroBateria = leerPref('ahorro_bateria', false);
    this.alarmaSilenciosa = leerPref('alarma_silenciosa', false);
    this.lugares = this.seguimientoAuto.lugares();
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }
  private ok(texto: string) {
    this.mensaje = texto;
    this.error = '';
    this.cdr.markForCheck();
  }

  guardarMensajeSos() {
    this.usuarioService.actualizarMensajeSos(this.auth.usuarioId(), this.mensajeSos).subscribe({
      next: () => {
        this.mensajeGuardado = true;
        this.ok('Mensaje SOS guardado.');
      },
      error: (e) => this.fallo(e),
    });
  }

  guardarTiempo() {
    const total = Number(this.horas) * 60 + Number(this.minutos);
    if (total <= 0) {
      this.fallo({ error: { message: 'El tiempo de monitoreo debe ser mayor a 0.' } });
      return;
    }
    guardarPref('tiempo_monitoreo', total);
    guardarPref('seguimiento_automatico', this.seguimientoAutomatico);
    this.ok('Tiempo de monitoreo guardado: ' + total + ' min.');
  }

  guardarPreferencias() {
    guardarPref('ahorro_bateria', this.ahorroBateria);
    guardarPref('alarma_silenciosa', this.alarmaSilenciosa);
    guardarPref('seguimiento_automatico', this.seguimientoAutomatico);
    this.seguimientoAuto.actualizar();
    if (this.seguimientoAutomatico && this.lugares.length === 0) {
      this.ok('Seguimiento automático activado. Marca al menos un lugar seguro para que funcione.');
      return;
    }
    this.ok('Preferencias guardadas en este navegador.');
  }

  // Marca la ubicación actual como lugar seguro (Casa, Trabajo...)
  marcarLugarSeguro() {
    const nombre = this.nombreLugar.trim();
    if (nombre === '') {
      this.fallo({ error: { message: 'Ponle un nombre al lugar (por ejemplo Casa o Trabajo).' } });
      return;
    }
    obtenerUbicacion().then((u) => {
      if (!u.real) {
        this.fallo({ error: { message: 'No se pudo obtener tu ubicación exacta. El navegador solo da el GPS en páginas seguras (HTTPS o localhost) y con el permiso de ubicación activado.' } });
        return;
      }
      this.lugares = [...this.lugares, { nombre, lat: u.lat, lng: u.lng, radio: Number(this.radioLugar) }];
      this.seguimientoAuto.guardarLugares(this.lugares);
      this.nombreLugar = '';
      this.ok('Lugar seguro guardado: ' + nombre + '.');
    });
  }

  quitarLugarSeguro(i: number) {
    this.lugares = this.lugares.filter((_, k) => k !== i);
    this.seguimientoAuto.guardarLugares(this.lugares);
    this.cdr.markForCheck();
  }

  guardarSensores() {
    if (this.dispositivos.length === 0) {
      return;
    }
    let pendientes = this.dispositivos.length;
    for (const d of this.dispositivos) {
      const estado = this.habilitados[d.id_dispositivo] ? 'HABILITADO' : 'DESHABILITADO';
      this.dispositivoService.update(d.id_dispositivo, { estado }).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.ok('Configuración de sensores guardada.');
          }
        },
        error: (e) => this.fallo(e),
      });
    }
  }

  guardarAnomalias() {
    if (this.dispositivos.length === 0) {
      this.fallo({ error: { message: 'Vincula un dispositivo para configurar la detección de anomalías.' } });
      return;
    }
    const tipos = this.anomalias.filter((a) => a.activa).map((a) => a.clave).join(',');
    let pendientes = this.dispositivos.length;
    for (const d of this.dispositivos) {
      this.dispositivoService.configurarAnomalias(d.id_dispositivo, tipos).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.ok('Reglas de anomalías guardadas.');
          }
        },
        error: (e) => this.fallo(e),
      });
    }
  }
}
