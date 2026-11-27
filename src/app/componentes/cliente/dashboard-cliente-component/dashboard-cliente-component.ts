import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { UsuarioService } from '../../../services/usuario-service';
import { AlertaService } from '../../../services/alerta-service';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { IncidenteService } from '../../../services/incidente-service';
import { NotificacionService } from '../../../services/notificacion-service';
import { SeguimientoService } from '../../../services/seguimiento-service';
import { UbicacionService } from '../../../services/ubicacion-service';
import { Alerta } from '../../../model/alerta';
import { Incidente } from '../../../model/incidente';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { ContactoConfianza } from '../../../model/contacto-confianza';
import { mensajeError } from '../../../core/mensajes';
import { claseEstadoReporte, colorRiesgo, guardarPref, hace, leerPref, LIMA, obtenerUbicacion, textoEstadoReporte } from '../../../core/utilidades';
import { GeocodificacionService } from '../../../services/geocodificacion-service';
import { CirculoMapa, MapaComponent, MarcadorMapa } from '../../compartido/mapa-component/mapa-component';
import { ConfirmarSosDialogComponent } from '../../compartido/confirmar-sos-dialog-component/confirmar-sos-dialog-component';
import { CompartirUbicacionDialogComponent } from '../../compartido/compartir-ubicacion-dialog-component/compartir-ubicacion-dialog-component';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';

@Component({
  imports: [RouterLink, DatePipe, MatButton, MatIcon, MapaComponent],
  selector: 'app-dashboard-cliente-component',
  styleUrl: './dashboard-cliente-component.css',
  templateUrl: './dashboard-cliente-component.html',
})
export class DashboardClienteComponent implements OnDestroy {
  auth: AuthService = inject(AuthService);
  usuarioService: UsuarioService = inject(UsuarioService);
  alertaService: AlertaService = inject(AlertaService);
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  incidenteService: IncidenteService = inject(IncidenteService);
  notificacionService: NotificacionService = inject(NotificacionService);
  seguimientoService: SeguimientoService = inject(SeguimientoService);
  ubicacionService: UbicacionService = inject(UbicacionService);
  dialog: MatDialog = inject(MatDialog);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  geo: GeocodificacionService = inject(GeocodificacionService);

  hace = hace;
  accesos: any = { contactos: [], dispositivos: [], seguimiento_activo: [], alertas_activas: [] };
  alertaActiva: Alerta | null = null;
  seguimientoActivo: any = null;
  zonas: ZonaRiesgo[] = [];
  incidentes: Incidente[] = [];
  noLeidas: number = 0;

  circulos: CirculoMapa[] = [];
  marcadores: MarcadorMapa[] = [];
  centro: [number, number] = LIMA;

  incidentesHoy: number = 0;
  zonasAltas: number = 0;
  prioritarias: Incidente[] = [];
  claseEstadoReporte = claseEstadoReporte;
  textoEstadoReporte = textoEstadoReporte;

  mensaje: string = '';
  error: string = '';

  // El dashboard se actualiza solo: cada 10 s (60 s con el modo ahorro de batería) vuelve a pedir alertas, reportes y zonas.
  // Así aparece una alarma nueva y desaparece un reporte que el administrador descartó.
  private refresco: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.cargar();
    this.refresco = setInterval(() => this.cargar(), leerPref('ahorro_bateria', false) === true ? 60000 : 10000);
    // El botón "Reportar Emergencia" del menú llega con ?sos=1
    this.route.queryParams.subscribe((params) => {
      if (params['sos']) {
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        this.activarSos();
      }
    });
  }

  cargar() {
    const id = this.auth.usuarioId();
    // HU-23: aviso cuando el seguimiento se inició solo al salir de una zona segura
    const aviso = leerPref('aviso_seguimiento_auto', '');
    if (aviso && Date.now() - new Date(aviso).getTime() < 6 * 3600000) {
      this.mensaje = 'Seguimiento iniciado automáticamente: saliste de tu zona segura.';
      guardarPref('aviso_seguimiento_auto', '');
    }
    this.usuarioService.accesosRapidos(id).subscribe({
      next: (a) => {
        const previa = this.alertaActiva;
        this.accesos = { contactos: [], dispositivos: [], seguimiento_activo: [], alertas_activas: [], ...a };
        this.alertaActiva = this.accesos.alertas_activas[0] ?? null;
        // Si la alerta activa dejó de estarlo, se avisa cómo terminó (por ejemplo, que el administrador la despachó)
        if (previa && (!this.alertaActiva || this.alertaActiva.id_alerta !== previa.id_alerta)) {
          this.alertaService.listId(previa.id_alerta).subscribe({
            next: (al) => {
              if (al.estado === 'DESPACHADA') {
                this.ok('Tu alerta fue atendida' + (al.codigo_despacho ? ' (unidad ' + al.codigo_despacho + ')' : '') + '.');
              } else if (al.estado === 'CANCELADA') {
                this.ok('Tu alerta fue cancelada.');
              }
            },
            error: () => {},
          });
        }
        this.seguimientoActivo = this.accesos.seguimiento_activo[0] ?? null;
        this.armarMapa();
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.zonaService.listActivas().subscribe({
      next: (z) => {
        this.zonas = z;
        this.zonasAltas = z.filter((x) => x.nivel_riesgo === 'ALTO').length;
        this.armarMapa();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.incidentes = lista.filter((i) => i.estado !== 'ELIMINADO');
        const hoy = new Date().toDateString();
        this.incidentesHoy = this.incidentes.filter((i) => new Date(i.fecha_hora).toDateString() === hoy).length;
        // Prioritarias: primero las de riesgo ALTO y, dentro de cada nivel, las más recientes
        const peso = (n: string) => (n === 'ALTO' ? 0 : n === 'MEDIO' ? 1 : 2);
        this.prioritarias = [...this.incidentes]
          .sort((a, b) => peso(a.nivel_riesgo) - peso(b.nivel_riesgo) || (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''))
          .slice(0, 3);
        this.armarMapa();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.notificacionService.listPorUsuario(id).subscribe({
      next: (n) => {
        this.noLeidas = n.filter((x) => x.estado !== 'LEIDA').length;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    if (this.refresco) {
      clearInterval(this.refresco);
    }
  }

  // Zonas de riesgo como círculos y los últimos incidentes y la alerta activa como puntos
  private armarMapa() {
    this.circulos = this.zonas.map((z) => ({
      lat: z.latitud,
      lng: z.longitud,
      radio: z.radio_metros || 300,
      color: colorRiesgo(z.nivel_riesgo),
      etiqueta: z.nombre + ' (' + z.nivel_riesgo + ')',
    }));
    this.marcadores = this.incidentes
      .filter((i) => i.latitud != null && i.longitud != null)
      .slice(0, 40)
      .map((i) => ({ lat: i.latitud, lng: i.longitud, color: colorRiesgo(i.nivel_riesgo), etiqueta: i.tipo_incidente }));
    if (this.alertaActiva && this.alertaActiva.latitud != null) {
      this.marcadores = [
        ...this.marcadores,
        { lat: this.alertaActiva.latitud, lng: this.alertaActiva.longitud, color: '#1a3a5c', etiqueta: 'Tu alerta activa' },
      ];
      this.centro = [this.alertaActiva.latitud, this.alertaActiva.longitud];
    }
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

  // ----- SOS -----
  activarSos() {
    this.dialog
      .open(ConfirmarSosDialogComponent, {
        width: '560px',
        disableClose: true,
        data: { contactos: this.accesos.contactos as ContactoConfianza[], mensaje: this.accesos.mensaje_sos || 'Se enviará tu ubicación y tu mensaje de emergencia a tus contactos de confianza.' },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          // HU-09: con la opción «Alarma silenciosa» de Configuración, el SOS se registra como silencioso
          this.enviarAlerta(leerPref('alarma_silenciosa', false) === true ? 'SILENCIOSA' : 'SOS');
        }
      });
  }

  alertaSilenciosa() {
    this.enviarAlerta('SILENCIOSA');
  }

  private enviarAlerta(tipo: string) {
    obtenerUbicacion().then(async (u) => {
      // En una emergencia no se espera mucho: si la dirección real no llega en 2 s, se envía el texto genérico
      const espera = new Promise<null>((r) => setTimeout(() => r(null), 2000));
      const real = await Promise.race([this.geo.inversa(u.lat, u.lng), espera]);
      this.alertaService
        .insert(this.auth.usuarioId(), {
          tipo_alerta: tipo,
          latitud: u.lat,
          longitud: u.lng,
          direccion: real ? real.texto : u.real ? 'Ubicación GPS del dispositivo' : 'Lima (ubicación aproximada)',
        })
        .subscribe({
          next: () => {
            this.ok(tipo === 'SOS' ? '¡Alerta SOS enviada! Tus contactos fueron notificados.' : 'Alerta silenciosa enviada.');
            this.cargar();
          },
          error: (e) => this.fallo(e),
        });
    });
  }

  cancelarAlerta() {
    if (!this.alertaActiva) {
      return;
    }
    const alerta = this.alertaActiva;
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '480px',
        data: {
          titulo: '¿Deseas cancelar la alerta de emergencia activa?',
          mensaje: 'Al confirmar, el estado de la alerta pasará de Activa a Cancelada y se notificará a tus contactos de confianza.',
          icono: 'notifications_off',
          tituloOpciones: 'Motivo de cancelación rápida (opcional)',
          opciones: ['Situación bajo control', 'Activación accidental / Falsa alarma', 'Ayuda recibida en el lugar', 'Otro motivo'],
          textoConfirmar: 'Confirmar Cancelación de Alerta',
          textoCancelar: 'Mantener alerta activa',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.alertaService.cancelar(alerta.id_alerta).subscribe({
            next: () => {
              this.ok('La alerta fue cancelada correctamente.');
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        }
      });
  }

  estoyBien() {
    if (this.alertaActiva) {
      this.cancelarAlerta();
    } else {
      this.ok('Gracias por confirmar que estás bien.');
    }
  }

  // ----- Compartir ubicación (seguimiento + ubicación GPS) -----
  compartirUbicacion() {
    this.dialog
      .open(CompartirUbicacionDialogComponent, { width: '540px', data: { contactos: this.accesos.contactos as ContactoConfianza[] } })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          this.iniciarSeguimiento('Ubicación compartida (geocerca ' + r.geocerca + ' m)', r.minutos);
        }
      });
  }

  // ----- Monitoreo -----
  alternarMonitoreo() {
    if (this.seguimientoActivo) {
      this.seguimientoService.finalizar(this.seguimientoActivo.id_seguimiento).subscribe({
        next: () => {
          this.ok('Monitoreo finalizado.');
          this.cargar();
        },
        error: (e) => this.fallo(e),
      });
    } else {
      const minutos = Number(leerPref('tiempo_monitoreo', 60));
      this.iniciarSeguimiento('Monitoreo general', minutos > 0 ? minutos : 60);
    }
  }

  private iniciarSeguimiento(destino: string, minutos: number) {
    obtenerUbicacion().then((u) => {
      // La columna destino de la base de datos admite como máximo 50 caracteres
      this.seguimientoService.insert(this.auth.usuarioId(), { destino: destino.slice(0, 50), tiempo_monitoreo: minutos }).subscribe({
        next: (s) => {
          this.ubicacionService
            .insert(s.id_seguimiento, { latitud: u.lat, longitud: u.lng, precision_metros: 20 })
            .subscribe({ next: () => {}, error: () => {} });
          this.ok('Seguimiento iniciado por ' + minutos + ' minutos.');
          this.cargar();
        },
        error: (e) => this.fallo(e),
      });
    });
  }
}
