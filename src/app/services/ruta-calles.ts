import { distanciaMetros } from '../core/utilidades';

// NO VISTO EN CLASE: API pública de OSRM (Open Source Routing Machine) con datos de OpenStreetMap.
// Calcula la ruta a pie siguiendo las calles y puede devolver rutas alternativas. Es gratuita y no
// pide clave. Se usa fetch y no HttpClient a propósito: el interceptor de la app agrega el token JWT
// a las peticiones de HttpClient y ese token no debe salir hacia un servicio externo.
const URL_OSRM = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const ESPERA_MAXIMA_MS = 8000;

// Zona de riesgo mínima que se necesita para puntuar una ruta
export interface ZonaPuntaje {
  latitud: number;
  longitud: number;
  radio_metros?: number | null;
  nivel_riesgo: string;
}

export interface RutaCalles {
  puntos: [number, number][]; // [latitud, longitud] siguiendo las calles
  distancia_m: number;
  duracion_s: number;
}

export interface Puntaje {
  puntaje: number; // ALTO pesa 3, MEDIO pesa 1
  altas: number; // zonas de riesgo alto que toca la ruta
  medias: number;
}

// Rutas por calles entre dos puntos ([lat, lng]); devuelve null si el servicio no responde
export async function trazarRutas(origen: [number, number], destino: [number, number]): Promise<RutaCalles[] | null> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
  try {
    // OSRM pide las coordenadas como longitud,latitud
    const coords = origen[1] + ',' + origen[0] + ';' + destino[1] + ',' + destino[0];
    const respuesta = await fetch(URL_OSRM + '/' + coords + '?overview=full&geometries=geojson&alternatives=true', { signal: control.signal });
    if (!respuesta.ok) {
      return null;
    }
    const datos = await respuesta.json();
    return cercanasALosPuntos(leerRutas(datos), origen, destino);
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}

// OSRM acerca cualquier punto a la calle más cercana, aunque esté muy lejos (por ejemplo, un punto en
// el mar). Se descartan las rutas que no empiezan y terminan a menos de 500 m de los puntos pedidos.
const TOLERANCIA_M = 500;
export function cercanasALosPuntos(rutas: RutaCalles[] | null, origen: [number, number], destino: [number, number]): RutaCalles[] | null {
  if (!rutas) {
    return null;
  }
  const buenas = rutas.filter((r) => {
    const inicio = r.puntos[0];
    const fin = r.puntos[r.puntos.length - 1];
    return distanciaMetros(inicio[0], inicio[1], origen[0], origen[1]) <= TOLERANCIA_M
      && distanciaMetros(fin[0], fin[1], destino[0], destino[1]) <= TOLERANCIA_M;
  });
  return buenas.length > 0 ? buenas : null;
}

// Convierte la respuesta de OSRM en rutas con puntos [lat, lng]
export function leerRutas(datos: any): RutaCalles[] | null {
  if (!datos || datos.code !== 'Ok' || !Array.isArray(datos.routes) || datos.routes.length === 0) {
    return null;
  }
  const rutas: RutaCalles[] = [];
  for (const r of datos.routes) {
    const coordenadas: number[][] = r?.geometry?.coordinates ?? [];
    const puntos = coordenadas
      .filter((c) => Array.isArray(c) && c.length >= 2 && isFinite(c[0]) && isFinite(c[1]))
      .map((c) => [c[1], c[0]] as [number, number]);
    if (puntos.length >= 2) {
      rutas.push({ puntos, distancia_m: Number(r.distance) || 0, duracion_s: Number(r.duration) || 0 });
    }
  }
  return rutas.length > 0 ? rutas : null;
}

// Cuántas zonas de riesgo alto y medio atraviesa una ruta. Se revisan puntos de la ruta (no solo los extremos).
export function puntuarRuta(puntos: [number, number][], zonas: ZonaPuntaje[]): Puntaje {
  const paso = Math.max(1, Math.floor(puntos.length / 200)); // máximo unos 200 puntos revisados
  let altas = 0;
  let medias = 0;
  for (const z of zonas) {
    const nivel = (z.nivel_riesgo ?? '').toUpperCase();
    if (nivel !== 'ALTO' && nivel !== 'MEDIO') {
      continue;
    }
    const radio = z.radio_metros && z.radio_metros > 0 ? z.radio_metros : 300;
    let toca = false;
    for (let i = 0; i < puntos.length && !toca; i += paso) {
      toca = distanciaMetros(puntos[i][0], puntos[i][1], z.latitud, z.longitud) <= radio;
    }
    if (toca) {
      if (nivel === 'ALTO') {
        altas++;
      } else {
        medias++;
      }
    }
  }
  return { puntaje: altas * 3 + medias, altas, medias };
}

export interface RutaElegida {
  ruta: RutaCalles;
  puntaje: Puntaje;
  opciones: number; // cuántas rutas se compararon
  esAlternativa: boolean; // true si no es la primera que devolvió OSRM
}

// La más segura: menor puntaje de riesgo; si empatan, la más corta
export function elegirMasSegura(rutas: RutaCalles[], zonas: ZonaPuntaje[]): RutaElegida {
  let mejor = 0;
  let mejorPuntaje = puntuarRuta(rutas[0].puntos, zonas);
  for (let i = 1; i < rutas.length; i++) {
    const p = puntuarRuta(rutas[i].puntos, zonas);
    if (p.puntaje < mejorPuntaje.puntaje || (p.puntaje === mejorPuntaje.puntaje && rutas[i].distancia_m < rutas[mejor].distancia_m)) {
      mejor = i;
      mejorPuntaje = p;
    }
  }
  return { ruta: rutas[mejor], puntaje: mejorPuntaje, opciones: rutas.length, esAlternativa: mejor > 0 };
}

// "8.7 km · 115 min a pie"
export function resumenRuta(r: RutaCalles): string {
  const km = Math.round(r.distancia_m / 100) / 10;
  const min = Math.max(1, Math.round(r.duracion_s / 60));
  return km + ' km · ' + min + ' min a pie';
}
