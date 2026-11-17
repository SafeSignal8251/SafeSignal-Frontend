// Respuesta de POST /api/authenticate
export class AuthResponse {
  jwt: string;
  id_usuario: number;
  roles: string[]; // ["ROLE_ADMIN"] o ["ROLE_CLIENTE"]
}

// Lo que guardamos de la sesión en el navegador
export class Sesion {
  jwt: string;
  id_usuario: number;
  roles: string[];
  nombres: string;
  apellidos: string;
  correo: string;
}
