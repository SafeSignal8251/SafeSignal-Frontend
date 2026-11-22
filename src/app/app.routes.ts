import { Routes } from '@angular/router';
import { adminGuard, clienteGuard, publicoGuard } from './core/auth-guard';

// ---- Públicas ----
import { InicioComponent } from './componentes/publico/inicio-component/inicio-component';
import { LoginComponent } from './componentes/publico/login-component/login-component';
import { RegistroComponent } from './componentes/publico/registro-component/registro-component';
import { RecuperarPasswordComponent } from './componentes/publico/recuperar-password-component/recuperar-password-component';
import { TerminosComponent } from './componentes/publico/terminos-component/terminos-component';
import { NuevaPasswordComponent } from './componentes/publico/nueva-password-component/nueva-password-component';
// ---- Cliente ----
import { DashboardClienteComponent } from './componentes/cliente/dashboard-cliente-component/dashboard-cliente-component';
import { MapaRiesgoComponent } from './componentes/cliente/mapa-riesgo-component/mapa-riesgo-component';
import { HistorialComponent } from './componentes/cliente/historial-component/historial-component';
import { ReportesComponent } from './componentes/cliente/reportes-component/reportes-component';
import { ReporteNuevoEditComponent } from './componentes/cliente/reporte-nuevo-edit-component/reporte-nuevo-edit-component';
import { SeguimientoComponent } from './componentes/cliente/seguimiento-component/seguimiento-component';
import { ReportePostEmergenciaComponent } from './componentes/cliente/reporte-post-emergencia-component/reporte-post-emergencia-component';
import { ReporteDetalleComponent } from './componentes/cliente/reporte-detalle-component/reporte-detalle-component';
import { EstadisticasComponent } from './componentes/cliente/estadisticas-component/estadisticas-component';
import { NotificacionesComponent } from './componentes/cliente/notificaciones-component/notificaciones-component';
import { ConfiguracionComponent } from './componentes/cliente/configuracion-component/configuracion-component';
import { ContactosComponent } from './componentes/cliente/contactos-component/contactos-component';
import { DispositivosComponent } from './componentes/cliente/dispositivos-component/dispositivos-component';
import { VincularDispositivoComponent } from './componentes/cliente/vincular-dispositivo-component/vincular-dispositivo-component';
import { PerfilComponent } from './componentes/cliente/perfil-component/perfil-component';
import { EditarPerfilComponent } from './componentes/cliente/editar-perfil-component/editar-perfil-component';
import { SuscribirZonaComponent } from './componentes/cliente/suscribir-zona-component/suscribir-zona-component';
// ---- Administrador ----
import { DashboardAdminComponent } from './componentes/admin/dashboard-admin-component/dashboard-admin-component';
import { GestionUsuariosComponent } from './componentes/admin/gestion-usuarios-component/gestion-usuarios-component';
import { ModeracionReportesComponent } from './componentes/admin/moderacion-reportes-component/moderacion-reportes-component';
import { UmbralesRiesgoComponent } from './componentes/admin/umbrales-riesgo-component/umbrales-riesgo-component';
import { EstadisticasGlobalesComponent } from './componentes/admin/estadisticas-globales-component/estadisticas-globales-component';
import { CentroComunicacionComponent } from './componentes/admin/centro-comunicacion-component/centro-comunicacion-component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // ---- Públicas ----
  { path: 'inicio', component: InicioComponent, canActivate: [publicoGuard] },
  { path: 'login', component: LoginComponent, canActivate: [publicoGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [publicoGuard] },
  { path: 'recuperar-password', component: RecuperarPasswordComponent, canActivate: [publicoGuard] },
  // Sin publicoGuard: también se usa desde "Cambiar contraseña" en Mi Perfil (con sesión iniciada)
  { path: 'nueva-password', component: NuevaPasswordComponent },

  // HU-45: términos y condiciones (se pueden leer con o sin sesión)
  { path: 'terminos', component: TerminosComponent },

  // ---- Cliente ----
  { path: 'dashboard', component: DashboardClienteComponent, canActivate: [clienteGuard] },
  { path: 'mapa-riesgo', component: MapaRiesgoComponent, canActivate: [clienteGuard] },
  { path: 'historial', component: HistorialComponent, canActivate: [clienteGuard] },
  { path: 'reportes', component: ReportesComponent, canActivate: [clienteGuard] },
  { path: 'reportes/nuevo', component: ReporteNuevoEditComponent, canActivate: [clienteGuard] },
  { path: 'reportes/editar/:id', component: ReporteNuevoEditComponent, canActivate: [clienteGuard] },
  { path: 'reportes/post-emergencia', component: ReportePostEmergenciaComponent, canActivate: [clienteGuard] },
  { path: 'reportes/:id', component: ReporteDetalleComponent, canActivate: [clienteGuard] },
  { path: 'seguimiento', component: SeguimientoComponent, canActivate: [clienteGuard] },
  { path: 'estadisticas', component: EstadisticasComponent, canActivate: [clienteGuard] },
  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [clienteGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [clienteGuard] },
  { path: 'contactos', component: ContactosComponent, canActivate: [clienteGuard] },
  { path: 'dispositivos', component: DispositivosComponent, canActivate: [clienteGuard] },
  { path: 'dispositivos/vincular', component: VincularDispositivoComponent, canActivate: [clienteGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [clienteGuard] },
  { path: 'perfil/editar', component: EditarPerfilComponent, canActivate: [clienteGuard] },
  { path: 'zonas/suscribir', component: SuscribirZonaComponent, canActivate: [clienteGuard] },

  // ---- Administrador ----
  { path: 'admin/dashboard', component: DashboardAdminComponent, canActivate: [adminGuard] },
  { path: 'admin/usuarios', component: GestionUsuariosComponent, canActivate: [adminGuard] },
  { path: 'admin/moderacion', component: ModeracionReportesComponent, canActivate: [adminGuard] },
  { path: 'admin/umbrales', component: UmbralesRiesgoComponent, canActivate: [adminGuard] },
  { path: 'admin/estadisticas', component: EstadisticasGlobalesComponent, canActivate: [adminGuard] },
  { path: 'admin/comunicacion', component: CentroComunicacionComponent, canActivate: [adminGuard] },

  { path: '**', redirectTo: 'inicio' },
];
