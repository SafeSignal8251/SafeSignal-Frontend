import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { adminGuard, clienteGuard, publicoGuard } from './auth-guard';
import { AuthService } from '../services/auth-service';
import { jwtDePrueba } from '../services/auth-service.spec';

// Pruebas de los guards de ruta (control de acceso por rol en el front)
describe('guards de ruta', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function iniciarSesion(rol: string) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    auth.sesion$.next({ jwt: jwtDePrueba(exp), id_usuario: 1, roles: [rol], nombres: 'A', apellidos: 'B', correo: 'a@b.com' });
  }

  const ejecutar = (guard: any) => TestBed.runInInjectionContext(() => guard({} as any, {} as any));
  const destino = (r: any) => router.serializeUrl(r as UrlTree);

  it('clienteGuard: sin sesión redirige a /login', () => {
    expect(destino(ejecutar(clienteGuard))).toBe('/login');
  });

  it('clienteGuard: un cliente puede entrar', () => {
    iniciarSesion('ROLE_CLIENTE');
    expect(ejecutar(clienteGuard)).toBe(true);
  });

  it('clienteGuard: un admin va a su dashboard', () => {
    iniciarSesion('ROLE_ADMIN');
    expect(destino(ejecutar(clienteGuard))).toBe('/admin/dashboard');
  });

  it('adminGuard: un cliente no entra a pantallas de admin', () => {
    iniciarSesion('ROLE_CLIENTE');
    expect(destino(ejecutar(adminGuard))).toBe('/dashboard');
  });

  it('adminGuard: un admin puede entrar', () => {
    iniciarSesion('ROLE_ADMIN');
    expect(ejecutar(adminGuard)).toBe(true);
  });

  it('publicoGuard: sin sesión deja ver login y registro', () => {
    expect(ejecutar(publicoGuard)).toBe(true);
  });

  it('publicoGuard: con sesión de cliente redirige al dashboard', () => {
    iniciarSesion('ROLE_CLIENTE');
    expect(destino(ejecutar(publicoGuard))).toBe('/dashboard');
  });
});
