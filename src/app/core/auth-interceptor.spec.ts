import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';
import { jwtDePrueba } from '../services/auth-service.spec';

// Pruebas del interceptor que agrega el JWT a cada petición
describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  function iniciarSesion() {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    auth.sesion$.next({ jwt: jwtDePrueba(exp), id_usuario: 1, roles: ['ROLE_CLIENTE'], nombres: 'A', apellidos: 'B', correo: 'a@b.com' });
  }

  it('agrega Authorization: Bearer en endpoints protegidos', () => {
    iniciarSesion();
    http.get('/api/contactos-confianza/usuario/1').subscribe();

    const req = controller.expectOne('/api/contactos-confianza/usuario/1');
    expect(req.request.headers.get('Authorization')).toBe('Bearer ' + auth.getToken());
  });

  it('no agrega el token en endpoints públicos (registro)', () => {
    iniciarSesion();
    http.post('/api/usuarios/registrar', {}).subscribe();

    expect(controller.expectOne('/api/usuarios/registrar').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 cierra la sesión y manda al login', () => {
    iniciarSesion();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get('/api/alertas').subscribe({ error: () => {} });
    controller.expectOne('/api/alertas').flush('no autenticado', { status: 401, statusText: 'Unauthorized' });

    expect(auth.getToken()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });

  it('ante un 403 mantiene la sesión (solo es falta de permisos)', () => {
    iniciarSesion();
    http.get('/api/usuarios/99').subscribe({ error: () => {} });
    controller.expectOne('/api/usuarios/99').flush({ code: 'ACCESS_DENIED' }, { status: 403, statusText: 'Forbidden' });

    expect(auth.getToken()).not.toBeNull();
  });
});
