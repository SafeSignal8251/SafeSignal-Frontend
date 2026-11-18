import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, Sesion } from '../model/auth';
import { Usuario } from '../model/usuario';

@Service()
export class AuthService {
  private httpClient: HttpClient = inject(HttpClient);
  // NO VISTO EN CLASE: localStorage (para no perder la sesión al recargar la página).
  private readonly CLAVE = 'safesignal_sesion';

  // Observable con la sesión actual (se usa con el pipe async, como en la clase de MVVM)
  sesion$ = new BehaviorSubject<Sesion | null>(this.leerSesion());

  // Datos temporales del flujo "olvidé mi contraseña" (correo y DNI verificados)
  recuperacion: { correo: string; dni: string } | null = null;

  // Paso 1: POST /usuarios/login valida correo, DNI, rol y que la cuenta esté activa.
  // Paso 2: POST /authenticate devuelve el token JWT.
  login(correo: string, dni: string, contrasena: string, rol: string): Observable<Sesion> {
    return this.httpClient
      .post<Usuario>(environment.apiURL + '/usuarios/login', { correo, dni, contrasena, rol })
      .pipe(
        switchMap((usuario) =>
          this.httpClient
            .post<AuthResponse>(environment.apiURL + '/authenticate', { correo, contrasena })
            .pipe(
              map((auth): Sesion => ({
                jwt: auth.jwt,
                id_usuario: auth.id_usuario,
                roles: Array.from(auth.roles),
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo,
              }))
            )
        ),
        tap((sesion) => this.guardarSesion(sesion))
      );
  }

  logout() {
    localStorage.removeItem(this.CLAVE);
    this.sesion$.next(null);
  }

  getToken(): string | null {
    const sesion = this.sesion$.value;
    return sesion ? sesion.jwt : null;
  }

  usuarioId(): number {
    const sesion = this.sesion$.value;
    return sesion ? sesion.id_usuario : 0;
  }

  estaLogueado(): boolean {
    const sesion = this.sesion$.value;
    if (!sesion) {
      return false;
    }
    if (this.tokenVencido(sesion.jwt)) {
      this.logout();
      return false;
    }
    return true;
  }

  esAdmin(): boolean {
    const sesion = this.sesion$.value;
    return !!sesion && sesion.roles.includes('ROLE_ADMIN');
  }

  nombreCompleto(): string {
    const sesion = this.sesion$.value;
    return sesion ? (sesion.nombres + ' ' + sesion.apellidos).trim() : '';
  }

  private guardarSesion(sesion: Sesion) {
    localStorage.setItem(this.CLAVE, JSON.stringify(sesion));
    this.sesion$.next(sesion);
  }

  private leerSesion(): Sesion | null {
    try {
      const texto = localStorage.getItem(this.CLAVE);
      return texto ? (JSON.parse(texto) as Sesion) : null;
    } catch (e) {
      return null;
    }
  }

  // El JWT tiene 3 partes separadas por "."; la del medio trae la fecha de expiración (exp)
  private tokenVencido(jwt: string): boolean {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp ? payload.exp * 1000 < Date.now() : false;
    } catch (e) {
      return false;
    }
  }
}
