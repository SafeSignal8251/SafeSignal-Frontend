import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

// NO VISTO EN CLASE: HttpInterceptorFn.
// El backend de SafeSignal exige el header "Authorization: Bearer <token>" en casi todos
// los endpoints. El interceptor lo agrega automáticamente a cada petición.
const URLS_PUBLICAS = [
  '/authenticate',
  '/usuarios/registrar',
  '/usuarios/login',
  '/usuarios/recuperar-password',
  '/usuarios/restablecer-password',
  '/usuarios/existe-correo',
  '/usuarios/existe-dni',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const esPublica = URLS_PUBLICAS.some((u) => req.url.includes(u));
  const token = auth.getToken();

  const peticion = token && !esPublica
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token vencido o inválido: se cierra la sesión y se vuelve al login
      if (err.status === 401 && !esPublica) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
