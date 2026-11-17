import { describe, expect, it } from 'vitest';
import { mensajeError } from './mensajes';

// Pruebas de la conversión de errores HTTP a mensajes para el usuario
describe('mensajeError', () => {
  it('avisa cuando no hay conexión con el backend (status 0)', () => {
    expect(mensajeError({ status: 0 })).toContain('No se pudo conectar');
  });

  it('usa el message que responde el backend ({ code, message })', () => {
    const err = { status: 400, error: { code: 'VALIDATION_ERROR', message: 'dni: formato inválido' } };
    expect(mensajeError(err)).toBe('dni: formato inválido');
  });

  it('lee el message cuando el cuerpo llega como texto JSON', () => {
    const err = { status: 400, error: '{"message":"Correo ya registrado"}' };
    expect(mensajeError(err)).toBe('Correo ya registrado');
  });

  it('muestra el texto tal cual si no es JSON', () => {
    expect(mensajeError({ status: 400, error: 'Algo salió mal' })).toBe('Algo salió mal');
  });

  it('403 sin cuerpo: mensaje de falta de permisos', () => {
    expect(mensajeError({ status: 403 })).toContain('No tienes permisos');
  });

  it('401 sin cuerpo: mensaje de sesión vencida', () => {
    expect(mensajeError({ status: 401 })).toContain('sesión expiró');
  });

  it('error desconocido: mensaje genérico', () => {
    expect(mensajeError({ status: 500 })).toContain('error inesperado');
  });
});
