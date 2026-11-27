import { describe, expect, it } from 'vitest';
import { cercanasALosPuntos, elegirMasSegura, leerRutas, puntuarRuta, resumenRuta, RutaCalles, ZonaPuntaje } from './ruta-calles';

// Pruebas de la HU-17 y la HU-19: ruta por calles y elección de la ruta más segura

// Ruta recta de oeste a este a la latitud dada (cada punto ~100 m)
function rutaEn(lat: number, desdeLng: number, hastaLng: number): RutaCalles {
  const puntos: [number, number][] = [];
  for (let lng = desdeLng; lng <= hastaLng; lng += 0.001) {
    puntos.push([lat, lng]);
  }
  return { puntos, distancia_m: puntos.length * 100, duracion_s: puntos.length * 72 };
}

const zonaAlta: ZonaPuntaje = { latitud: -12.05, longitud: -77.04, radio_metros: 300, nivel_riesgo: 'ALTO' };
const zonaMedia: ZonaPuntaje = { latitud: -12.05, longitud: -77.02, radio_metros: 300, nivel_riesgo: 'MEDIO' };
const zonaBaja: ZonaPuntaje = { latitud: -12.05, longitud: -77.03, radio_metros: 300, nivel_riesgo: 'BAJO' };

describe('ruta-calles', () => {
  it('lee la respuesta de OSRM y pasa [lng, lat] a [lat, lng]', () => {
    const rutas = leerRutas({
      code: 'Ok',
      routes: [{ distance: 1500, duration: 1200, geometry: { coordinates: [[-77.04, -12.04], [-77.03, -12.05]] } }],
    });
    expect(rutas).not.toBeNull();
    expect(rutas![0].puntos[0]).toEqual([-12.04, -77.04]);
    expect(rutas![0].distancia_m).toBe(1500);
  });

  it('una respuesta sin rutas o con error se considera no disponible', () => {
    expect(leerRutas(null)).toBeNull();
    expect(leerRutas({ code: 'NoRoute', routes: [] })).toBeNull();
    expect(leerRutas({ code: 'Ok', routes: [{ geometry: { coordinates: [[-77, -12]] } }] })).toBeNull();
  });

  it('una ruta que pasa por una zona de riesgo alto pesa más que una que no', () => {
    const porLaZona = puntuarRuta(rutaEn(-12.05, -77.05, -77.03).puntos, [zonaAlta, zonaMedia, zonaBaja]);
    expect(porLaZona.altas).toBe(1);
    expect(porLaZona.medias).toBe(0);
    expect(porLaZona.puntaje).toBe(3);

    const lejos = puntuarRuta(rutaEn(-12.0, -77.05, -77.03).puntos, [zonaAlta, zonaMedia, zonaBaja]);
    expect(lejos.puntaje).toBe(0);
  });

  it('las zonas de riesgo bajo no suman puntaje', () => {
    expect(puntuarRuta(rutaEn(-12.05, -77.04, -77.02).puntos, [zonaBaja]).puntaje).toBe(0);
  });

  it('entre varias rutas elige la que toca menos zonas peligrosas', () => {
    const peligrosa = rutaEn(-12.05, -77.05, -77.03); // cruza la zona de riesgo alto
    const segura = rutaEn(-12.0, -77.05, -77.03); // da la vuelta por otra calle
    const elegida = elegirMasSegura([peligrosa, segura], [zonaAlta]);
    expect(elegida.ruta).toBe(segura);
    expect(elegida.esAlternativa).toBe(true);
    expect(elegida.opciones).toBe(2);
    expect(elegida.puntaje.puntaje).toBe(0);
  });

  it('si todas son igual de seguras elige la más corta', () => {
    const larga = rutaEn(-12.0, -77.05, -77.0);
    const corta = rutaEn(-11.9, -77.05, -77.03);
    expect(elegirMasSegura([larga, corta], [zonaAlta]).ruta).toBe(corta);
  });

  it('descarta rutas que no llegan cerca de los puntos pedidos (OSRM acerca un punto lejano a la calle más cercana)', () => {
    const ruta = rutaEn(-12.05, -77.05, -77.03);
    const inicio = ruta.puntos[0];
    const fin = ruta.puntos[ruta.puntos.length - 1];
    expect(cercanasALosPuntos([ruta], inicio, fin)).toEqual([ruta]);
    // el destino pedido está a más de 10 km del final de la ruta
    expect(cercanasALosPuntos([ruta], inicio, [-12.05, -76.9])).toBeNull();
    expect(cercanasALosPuntos(null, inicio, fin)).toBeNull();
  });

  it('resume la ruta en kilómetros y minutos a pie', () => {
    expect(resumenRuta({ puntos: [], distancia_m: 8652, duracion_s: 6934 })).toBe('8.7 km · 116 min a pie');
  });
});
