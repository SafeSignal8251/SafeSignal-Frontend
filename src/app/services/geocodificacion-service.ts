import { Injectable } from '@angular/core';
import { DISTRITOS_LIMA } from '../core/utilidades';

// Dirección ya lista para usar en un formulario
export interface Direccion {
  texto: string; // "Av. Arequipa 1200, Lince"
  lat: number;
  lng: number;
  distrito: string | null; // coincide con la lista de distritos de la app, si se pudo deducir
}

// NO VISTO EN CLASE: API pública de OpenStreetMap (Nominatim) para convertir una dirección en
// coordenadas y al revés. Es gratuita y no pide clave, pero acepta como máximo 1 consulta por segundo.
// Se usa fetch y no HttpClient a propósito: el interceptor de la app agrega el token JWT a las
// peticiones de HttpClient y ese token no debe salir hacia un servicio externo.
const URL_BASE = 'https://nominatim.openstreetmap.org';
const ESPERA_MAXIMA_MS = 6000;

// Nombres con los que OpenStreetMap llama a algunos distritos
const ALIAS_DISTRITOS: { [nombre: string]: string } = {
  'cercado de lima': 'Lima Cercado',
  'distrito de lima': 'Lima Cercado',
  'lurigancho': 'Lurigancho-Chosica',
  'chosica': 'Lurigancho-Chosica',
};

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').toLowerCase().trim();
}

// Busca entre los campos de la dirección de OpenStreetMap un distrito que exista en la lista de la app
export function distritoDe(direccion: any, lista: string[] = DISTRITOS_LIMA): string | null {
  if (!direccion) {
    return null;
  }
  // Una dirección de otra región (por ejemplo un "Miraflores" de Arequipa) no es un distrito de la lista
  const region = normalizar([direccion.state, direccion.region, direccion.state_district].filter((x) => typeof x === 'string').join(' '));
  if (region !== '' && !/lima|callao/.test(region)) {
    return null;
  }
  const candidatos = [
    direccion.suburb, direccion.city_district, direccion.neighbourhood, direccion.quarter,
    direccion.town, direccion.village, direccion.municipality, direccion.county, direccion.city,
  ].filter((c) => typeof c === 'string' && c.trim() !== '');
  for (const c of candidatos) {
    const n = normalizar(c);
    if (ALIAS_DISTRITOS[n] && lista.includes(ALIAS_DISTRITOS[n])) {
      return ALIAS_DISTRITOS[n];
    }
    // coincidencia exacta o como palabra completa ("Distrito de Ate" sí, "Chaclacayo" no coincide con "Ate")
    const encontrado = lista.find((d) => normalizar(d) === n)
      ?? lista.find((d) => new RegExp('\\b' + normalizar(d).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n));
    if (encontrado) {
      return encontrado;
    }
  }
  return null;
}

// "Av. Arequipa 1200, Lince" a partir de la respuesta de OpenStreetMap
function armarTexto(item: any): string {
  const a = item.address ?? {};
  const calle = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? a.neighbourhood ?? '';
  const via = calle ? calle + (a.house_number ? ' ' + a.house_number : '') : '';
  const zona = a.suburb ?? a.city_district ?? a.town ?? a.village ?? '';
  const partes = [via, zona].filter((p) => p !== '');
  if (partes.length > 0) {
    return partes.join(', ');
  }
  return String(item.display_name ?? '').split(',').slice(0, 3).join(',').trim();
}

function aDireccion(item: any): Direccion | null {
  const lat = Number(item?.lat);
  const lng = Number(item?.lon);
  if (!isFinite(lat) || !isFinite(lng)) {
    return null;
  }
  return { texto: armarTexto(item), lat, lng, distrito: distritoDe(item.address) };
}

@Injectable({ providedIn: 'root' })
export class GeocodificacionService {
  // Dirección escrita -> hasta 5 sugerencias con sus coordenadas (solo Perú, sesgado a Lima)
  async buscar(texto: string): Promise<Direccion[]> {
    const q = texto.trim();
    if (q.length < 3) {
      return [];
    }
    const url = URL_BASE + '/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=pe&accept-language=es'
      + '&viewbox=-77.20,-11.80,-76.80,-12.30&q=' + encodeURIComponent(q);
    const datos = await this.pedir(url);
    return Array.isArray(datos) ? datos.map(aDireccion).filter((d): d is Direccion => d !== null) : [];
  }

  // Coordenadas -> dirección real. Devuelve null si no se pudo (sin internet, servicio caído, etc.)
  async inversa(lat: number, lng: number): Promise<Direccion | null> {
    const url = URL_BASE + '/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=es&lat=' + lat + '&lon=' + lng;
    const dato = await this.pedir(url);
    return dato && !dato.error ? aDireccion(dato) : null;
  }

  private async pedir(url: string): Promise<any> {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
    try {
      const r = await fetch(url, { signal: control.signal, headers: { Accept: 'application/json' } });
      return r.ok ? await r.json() : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(reloj);
    }
  }
}

// Ayuda para los formularios: espera a que el usuario deje de escribir antes de consultar
// (Nominatim limita el uso) y guarda la lista de sugerencias que se muestra bajo el campo.
export class BuscadorDirecciones {
  sugerencias: Direccion[] = [];
  buscando: boolean = false;
  private reloj: any = null;
  private ultimaBusqueda: number = 0;

  constructor(private geo: GeocodificacionService, private alCambiar: () => void, private espera: number = 700) {}

  escribir(texto: string) {
    clearTimeout(this.reloj);
    if (texto.trim().length < 4) {
      this.sugerencias = [];
      this.buscando = false;
      this.alCambiar();
      return;
    }
    this.reloj = setTimeout(() => {
      const turno = ++this.ultimaBusqueda;
      this.buscando = true;
      this.alCambiar();
      this.geo.buscar(texto).then((r) => {
        if (turno === this.ultimaBusqueda) {
          this.sugerencias = r;
          this.buscando = false;
          this.alCambiar();
        }
      });
    }, this.espera);
  }

  cerrar() {
    clearTimeout(this.reloj);
    this.ultimaBusqueda++;
    this.sugerencias = [];
    this.buscando = false;
    this.alCambiar();
  }
}
