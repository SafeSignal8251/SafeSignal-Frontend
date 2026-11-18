import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth-service';

// Arma un JWT de prueba (cabecera.payload.firma) con la expiración indicada
export function jwtDePrueba(expSegundos: number): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '');
  return `${b64({ alg: 'HS512' })}.${b64({ sub: 'ana@correo.com', exp: expSegundos })}.firma`;
}

const sesionDe = (jwt: string, rol: string) => ({
  jwt,
  id_usuario: 7,
  roles: [rol],
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo: 'ana@correo.com',
});

// Pruebas del servicio de sesión (JWT guardado en el navegador)
describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('sin sesión: no está logueado y no hay token', () => {
    expect(service.estaLogueado()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.usuarioId()).toBe(0);
  });

  it('login: valida el usuario, pide el token y guarda la sesión', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    let sesion: any;
    service.login('ana@correo.com', '12345678', 'Clave12345', 'CLIENTE').subscribe((s) => (sesion = s));

    http.expectOne((r) => r.url.endsWith('/usuarios/login')).flush({ nombres: 'Ana', apellidos: 'Pérez', correo: 'ana@correo.com' });
    http.expectOne((r) => r.url.endsWith('/authenticate')).flush({ jwt: jwtDePrueba(exp), id_usuario: 7, roles: ['ROLE_CLIENTE'] });

    expect(sesion.id_usuario).toBe(7);
    expect(service.estaLogueado()).toBe(true);
    expect(service.esAdmin()).toBe(false);
    expect(service.nombreCompleto()).toBe('Ana Pérez');
    expect(localStorage.getItem('safesignal_sesion')).toContain('ana@correo.com');
  });

  it('reconoce al administrador por el rol ROLE_ADMIN', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    service.sesion$.next(sesionDe(jwtDePrueba(exp), 'ROLE_ADMIN'));

    expect(service.esAdmin()).toBe(true);
  });

  it('un token vencido cierra la sesión automáticamente', () => {
    const vencido = Math.floor(Date.now() / 1000) - 60;
    service.sesion$.next(sesionDe(jwtDePrueba(vencido), 'ROLE_CLIENTE'));

    expect(service.estaLogueado()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('logout borra la sesión guardada', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    service.sesion$.next(sesionDe(jwtDePrueba(exp), 'ROLE_CLIENTE'));
    localStorage.setItem('safesignal_sesion', 'x');

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('safesignal_sesion')).toBeNull();
  });
});
