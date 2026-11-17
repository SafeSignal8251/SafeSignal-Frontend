// Convierte un error HTTP en un texto para mostrarle al usuario.
// El backend responde errores como { code, message }.
export function mensajeError(err: any): string {
  if (err?.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
  }
  const cuerpo = err?.error;
  if (cuerpo?.message) {
    return cuerpo.message;
  }
  if (typeof cuerpo === 'string' && cuerpo.trim() !== '') {
    try {
      const json = JSON.parse(cuerpo);
      if (json?.message) {
        return json.message;
      }
    } catch (e) {
      // no era JSON, se muestra el texto tal cual
    }
    return cuerpo;
  }
  if (err?.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }
  if (err?.status === 401) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
}
