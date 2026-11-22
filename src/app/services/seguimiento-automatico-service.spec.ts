import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeguimientoAutomaticoService } from './seguimiento-automatico-service';

// Pruebas de la HU-23: detectar si el cliente está dentro de alguno de sus lugares seguros
describe('SeguimientoAutomaticoService', () => {
  let service: SeguimientoAutomaticoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SeguimientoAutomaticoService);
  });

  it('sin lugares seguros guardados nunca está dentro de una zona segura', () => {
    expect(service.lugares()).toEqual([]);
    expect(service.estaDentro(-12.0464, -77.0428)).toBe(false);
  });

  it('dentro del radio de un lugar seguro está dentro; fuera del radio, no', () => {
    service.guardarLugares([{ nombre: 'Casa', lat: -12.0464, lng: -77.0428, radio: 200 }]);

    expect(service.lugares().length).toBe(1);
    expect(service.estaDentro(-12.0464, -77.0428)).toBe(true); // el mismo punto
    expect(service.estaDentro(-12.0472, -77.0428)).toBe(true); // a unos 90 m
    expect(service.estaDentro(-12.0600, -77.0428)).toBe(false); // a más de 1 km
  });

  it('con varios lugares basta con estar dentro de uno', () => {
    service.guardarLugares([
      { nombre: 'Casa', lat: -12.0464, lng: -77.0428, radio: 100 },
      { nombre: 'Trabajo', lat: -12.1200, lng: -77.0300, radio: 300 },
    ]);

    expect(service.estaDentro(-12.1201, -77.0301)).toBe(true);
    expect(service.estaDentro(-12.0800, -77.0400)).toBe(false);
  });
});
