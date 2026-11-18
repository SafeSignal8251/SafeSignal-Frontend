import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../model/usuario';

@Service()
export class UsuarioService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/usuarios';

  // ---- Públicos ----
  registrar(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.httpClient.post<Usuario>(this.url + '/registrar', usuario);
  }
  existeCorreo(correo: string): Observable<boolean> {
    return this.httpClient.get<boolean>(this.url + '/existe-correo/' + correo);
  }
  existeDni(dni: string): Observable<boolean> {
    return this.httpClient.get<boolean>(this.url + '/existe-dni/' + dni);
  }
  // Paso 1 de recuperar contraseña: verifica que correo y DNI correspondan a una cuenta
  recuperarPassword(correo: string, dni: string): Observable<string> {
    return this.httpClient.post(this.url + '/recuperar-password', { correo, dni }, { responseType: 'text' });
  }
  // Paso 2: guarda la nueva contraseña
  restablecerPassword(correo: string, dni: string, contrasena: string): Observable<string> {
    return this.httpClient.put(this.url + '/restablecer-password', { correo, dni, contrasena }, { responseType: 'text' });
  }

  // ---- Con sesión iniciada ----
  listId(id: number): Observable<Usuario> {
    return this.httpClient.get<Usuario>(this.url + '/' + id);
  }
  update(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.httpClient.put<Usuario>(this.url + '/' + id, usuario);
  }
  actualizarMensajeSos(id: number, mensaje: string): Observable<Usuario> {
    return this.httpClient.put<Usuario>(this.url + '/' + id + '/mensaje-sos', null, { params: { mensaje } });
  }
  accesosRapidos(id: number): Observable<any> {
    return this.httpClient.get<any>(this.url + '/' + id + '/accesos-rapidos');
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }

  // ---- Solo administrador ----
  list(): Observable<Usuario[]> {
    return this.httpClient.get<Usuario[]>(this.url);
  }
  suspender(id: number, motivo: string): Observable<Usuario> {
    return this.httpClient.put<Usuario>(this.url + '/' + id + '/suspender', null, { params: { motivo } });
  }
  reactivar(id: number): Observable<Usuario> {
    return this.httpClient.put<Usuario>(this.url + '/' + id + '/reactivar', null);
  }
}
