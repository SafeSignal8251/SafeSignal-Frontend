import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alerta } from '../model/alerta';

@Service()
export class AlertaService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/alertas';

  list(): Observable<Alerta[]> {
    return this.httpClient.get<Alerta[]>(this.url);
  }
  listId(id: number): Observable<Alerta> {
    return this.httpClient.get<Alerta>(this.url + '/' + id);
  }
  listPorUsuario(id_usuario: number): Observable<Alerta[]> {
    return this.httpClient.get<Alerta[]>(this.url + '/usuario/' + id_usuario);
  }
  listPorEstado(estado: string): Observable<Alerta[]> {
    return this.httpClient.get<Alerta[]>(this.url + '/estado/' + estado);
  }
  // tipo_alerta: 'SOS' o 'SILENCIOSA'. La ubicación (latitud y longitud) es obligatoria.
  insert(id_usuario: number, alerta: Partial<Alerta>): Observable<Alerta> {
    return this.httpClient.post<Alerta>(this.url, alerta, { params: { id_usuario } });
  }
  cancelar(id: number): Observable<Alerta> {
    return this.httpClient.put<Alerta>(this.url + '/' + id + '/cancelar', null);
  }
  // Solo administrador
  despachar(id: number, codigo_despacho: string): Observable<Alerta> {
    return this.httpClient.put<Alerta>(this.url + '/' + id + '/despachar', null, { params: { codigo_despacho } });
  }
  cambiarEstado(id: number, estado: string): Observable<Alerta> {
    return this.httpClient.put<Alerta>(this.url + '/' + id + '/estado', null, { params: { estado } });
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
