import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

// NO VISTO EN CLASE: guards de ruta (CanActivateFn).

// Solo para pantallas públicas (inicio, login, registro...): si ya inició sesión, lo manda a su dashboard.
export const publicoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) {
    return true;
  }
  return router.createUrlTree([auth.esAdmin() ? '/admin/dashboard' : '/dashboard']);
};

// Solo clientes con sesión iniciada
export const clienteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.esAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return true;
};

// Solo administradores con sesión iniciada
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.esAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
