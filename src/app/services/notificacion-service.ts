import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion } from '../model/notificacion';

@Service()
export class NotificacionService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/notificaciones';

  list(): Observable<Notificacion[]> {
    return this.httpClient.get<Notificacion[]>(this.url);
  }
  listPorUsuario(id_usuario: number): Observable<Notificacion[]> {
    return this.httpClient.get<Notificacion[]>(this.url + '/usuario/' + id_usuario);
  }
  listPorAlerta(id_alerta: number): Observable<Notificacion[]> {
    return this.httpClient.get<Notificacion[]>(this.url + '/alerta/' + id_alerta);
  }
  cambiarEstado(id: number, estado: string): Observable<Notificacion> {
    return this.httpClient.put<Notificacion>(this.url + '/' + id + '/estado', null, { params: { estado } });
  }
  // Solo administrador. id_zona vacío = todos los clientes. Máximo 200 caracteres. Responde un texto.
  enviarAviso(id_admin: number, id_zona: number | null, severidad: string, mensaje: string): Observable<string> {
    const params: any = { id_admin };
    if (id_zona) { params['id_zona'] = id_zona; }
    return this.httpClient.post(this.url + '/aviso', { severidad, mensaje }, { params, responseType: 'text' });
  }
}
