import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DISTRITOS_LIMA } from '../core/utilidades';
import { distritoDe, GeocodificacionService } from './geocodificacion-service';

const respuesta = (datos: any, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(datos) } as Response);

// Pruebas de la conversión dirección <-> coordenadas (se simula fetch, no se llama a internet)
describe('GeocodificacionService', () => {
  let service: GeocodificacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeocodificacionService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('buscar: convierte la respuesta en direcciones con coordenadas y distrito', async () => {
    const fetchSimulado = vi.fn().mockReturnValue(
      respuesta([{ lat: '-12.0833', lon: '-77.0333', display_name: 'x', address: { road: 'Avenida Arequipa', house_number: '1200', suburb: 'Lince' } }])
    );
    vi.stubGlobal('fetch', fetchSimulado);

    const r = await service.buscar('Av Arequipa 1200');

    expect(r.length).toBe(1);
    expect(r[0].texto).toBe('Avenida Arequipa 1200, Lince');
    expect(r[0].lat).toBeCloseTo(-12.0833);
    expect(r[0].distrito).toBe('Lince');
    expect(String(fetchSimulado.mock.calls[0][0])).toContain('countrycodes=pe');
  });

  it('buscar: con menos de 3 letras no consulta', async () => {
    const fetchSimulado = vi.fn();
    vi.stubGlobal('fetch', fetchSimulado);
    expect(await service.buscar('av')).toEqual([]);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('buscar: si el servicio falla devuelve una lista vacía', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin internet')));
    expect(await service.buscar('Av Arequipa 1200')).toEqual([]);
  });

  it('inversa: devuelve la dirección del punto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(
      respuesta({ lat: '-12.12', lon: '-77.03', display_name: 'a, b', address: { road: 'Av. Larco', suburb: 'Miraflores' } })
    ));
    const d = await service.inversa(-12.12, -77.03);
    expect(d?.texto).toBe('Av. Larco, Miraflores');
    expect(d?.distrito).toBe('Miraflores');
  });

  it('inversa: sin respuesta válida devuelve null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respuesta({ error: 'Unable to geocode' })));
    expect(await service.inversa(0, 0)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respuesta(null, false)));
    expect(await service.inversa(0, 0)).toBeNull();
  });
});

describe('distritoDe', () => {
  it('reconoce el distrito aunque cambien tildes o mayúsculas', () => {
    expect(distritoDe({ suburb: 'RIMAC' })).toBe('Rímac');
    expect(distritoDe({ suburb: 'Jesus Maria' })).toBe('Jesús María');
  });

  it('el Cercado de Lima se llama Lima Cercado en la app', () => {
    expect(distritoDe({ city_district: 'Cercado de Lima' })).toBe('Lima Cercado');
  });

  it('la lista tiene los 43 distritos de Lima y los 7 del Callao, sin repetidos', () => {
    expect(DISTRITOS_LIMA.length).toBe(50);
    expect(new Set(DISTRITOS_LIMA).size).toBe(50);
    for (const d of ['Carabayllo', 'Los Olivos', 'San Martín de Porres', 'Villa María del Triunfo', 'Puente Piedra', 'Ventanilla']) {
      expect(DISTRITOS_LIMA).toContain(d);
    }
  });

  it('reconoce distritos que antes faltaban y los nombres alternativos de OpenStreetMap', () => {
    expect(distritoDe({ suburb: 'Los Olivos' })).toBe('Los Olivos');
    expect(distritoDe({ city_district: 'Distrito de Ate' })).toBe('Ate');
    expect(distritoDe({ suburb: 'Chosica' })).toBe('Lurigancho-Chosica');
    expect(distritoDe({ suburb: 'San Juan de Lurigancho' })).toBe('San Juan de Lurigancho');
  });

  it('si el distrito no está en la lista devuelve null', () => {
    expect(distritoDe({ suburb: 'Yanahuara' })).toBeNull();
    // mismo nombre de distrito pero en otra región: no debe mapearse a Lima
    expect(distritoDe({ suburb: 'Miraflores', state: 'Arequipa' })).toBeNull();
    expect(distritoDe({ suburb: 'Miraflores', state: 'Lima Metropolitana' })).toBe('Miraflores');
    expect(distritoDe(undefined)).toBeNull();
  });
});
