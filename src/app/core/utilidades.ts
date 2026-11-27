// Funciones pequeñas que se repiten en varias pantallas.

// "Hace 5 min", "Hace 2 h", "Hace 3 d"
export function hace(fechaIso: string | null | undefined): string {
  if (!fechaIso) {
    return '';
  }
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000));
  if (minutos < 1) { return 'Hace instantes'; }
  if (minutos < 60) { return 'Hace ' + minutos + ' min'; }
  const horas = Math.round(minutos / 60);
  if (horas < 24) { return 'Hace ' + horas + ' h'; }
  return 'Hace ' + Math.round(horas / 24) + ' d';
}

// Distancia en metros entre dos coordenadas (fórmula de Haversine)
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Distritos de Lima Metropolitana (43) y de la Provincia Constitucional del Callao (7).
// Una sola lista para registro, perfil, reportes y búsqueda de direcciones.
export const DISTRITOS_LIMA: string[] = [
  'Ancón', 'Ate', 'Barranco', 'Bellavista', 'Breña', 'Callao', 'Carabayllo', 'Carmen de la Legua Reynoso', 'Chaclacayo',
  'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Perla', 'La Punta',
  'La Victoria', 'Lima Cercado', 'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Mi Perú',
  'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
  'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
  'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
  'Surquillo', 'Ventanilla', 'Villa El Salvador', 'Villa María del Triunfo',
];

// Centro de Lima: se usa cuando el navegador no da la ubicación
export const LIMA: [number, number] = [-12.0464, -77.0428];

// real = GPS del navegador; aproximada = según la conexión a internet (IP); ninguna de las dos = centro de Lima
export interface Ubicacion {
  lat: number;
  lng: number;
  real: boolean;
  aproximada?: boolean;
}

// NO VISTO EN CLASE: API pública ipwho.is (gratuita, sin clave) para saber la ciudad desde la IP.
// Se usa fetch y no HttpClient para que el token JWT de la app no salga hacia un servicio externo.
let ubicacionIp: Ubicacion | null = null;
async function ubicacionPorIp(): Promise<Ubicacion | null> {
  if (ubicacionIp) {
    return ubicacionIp;
  }
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 4000);
  try {
    const respuesta = await fetch('https://ipwho.is/', { signal: control.signal });
    const d = await respuesta.json();
    // Solo se acepta si está en Perú: las zonas de riesgo de la app son de Lima y Callao
    if (d && d.success === true && d.country_code === 'PE' && isFinite(d.latitude) && isFinite(d.longitude)) {
      ubicacionIp = { lat: Number(d.latitude), lng: Number(d.longitude), real: false, aproximada: true };
    }
  } catch {
    // sin internet o servicio caído: se usa el centro de Lima
  } finally {
    clearTimeout(temporizador);
  }
  return ubicacionIp;
}

// NO VISTO EN CLASE: navigator.geolocation (ubicación del navegador).
// Los navegadores solo dan el GPS en páginas seguras (HTTPS o localhost). Si no se puede, se usa la
// ubicación aproximada por IP y, como último recurso, el centro de Lima.
export function obtenerUbicacion(): Promise<Ubicacion> {
  return new Promise((resolver) => {
    const respaldo = () => {
      ubicacionPorIp().then((u) => resolver(u ?? { lat: LIMA[0], lng: LIMA[1], real: false }));
    };
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      respaldo();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({ lat: pos.coords.latitude, lng: pos.coords.longitude, real: true }),
      () => respaldo(),
      { timeout: 6000 }
    );
  });
}

// Texto para mostrar de dónde salió la ubicación
export function textoOrigenUbicacion(u: Ubicacion): string {
  return u.real ? 'Mi ubicación actual' : u.aproximada ? 'Mi ubicación aproximada' : 'Centro de Lima';
}

// Color de un nivel de riesgo (ALTO / MEDIO / BAJO)
export function colorRiesgo(nivel: string | null | undefined): string {
  const n = (nivel ?? '').toUpperCase();
  if (n === 'ALTO') { return '#c0392b'; }
  if (n === 'MEDIO') { return '#e6a817'; }
  return '#1e9a5e';
}

// Estado de un reporte comunitario: color propio para PENDIENTE, VERIFICADO y ELIMINADO
export function claseEstadoReporte(estado: string | null | undefined): string {
  const e = (estado ?? '').toUpperCase();
  if (e === 'VERIFICADO') { return 'badge-verde'; }
  if (e === 'ELIMINADO') { return 'badge-eliminado'; }
  return 'badge-amarillo';
}
export function textoEstadoReporte(estado: string | null | undefined): string {
  const e = (estado ?? '').toUpperCase();
  if (e === 'VERIFICADO') { return 'Verificado'; }
  if (e === 'ELIMINADO') { return 'Eliminado'; }
  return 'Pendiente';
}

// Preferencias que el backend no guarda (se dejan en el navegador)
export function leerPref(clave: string, defecto: any): any {
  try {
    const t = localStorage.getItem('safesignal_pref_' + clave);
    return t === null ? defecto : JSON.parse(t);
  } catch (e) {
    return defecto;
  }
}
export function guardarPref(clave: string, valor: any) {
  localStorage.setItem('safesignal_pref_' + clave, JSON.stringify(valor));
}
