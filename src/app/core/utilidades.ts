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

// Centro de Lima: se usa cuando el navegador no da la ubicación
export const LIMA: [number, number] = [-12.0464, -77.0428];

// NO VISTO EN CLASE: navigator.geolocation (ubicación del navegador)
export function obtenerUbicacion(): Promise<{ lat: number; lng: number; real: boolean }> {
  return new Promise((resolver) => {
    if (!navigator.geolocation) {
      resolver({ lat: LIMA[0], lng: LIMA[1], real: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({ lat: pos.coords.latitude, lng: pos.coords.longitude, real: true }),
      () => resolver({ lat: LIMA[0], lng: LIMA[1], real: false }),
      { timeout: 6000 }
    );
  });
}

// Color de un nivel de riesgo (ALTO / MEDIO / BAJO)
export function colorRiesgo(nivel: string | null | undefined): string {
  const n = (nivel ?? '').toUpperCase();
  if (n === 'ALTO') { return '#c0392b'; }
  if (n === 'MEDIO') { return '#e6a817'; }
  return '#1e9a5e';
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
