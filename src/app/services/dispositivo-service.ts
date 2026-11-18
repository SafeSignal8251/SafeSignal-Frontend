import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DispositivoIoT } from '../model/dispositivo-iot';

@Service()
export class DispositivoService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/dispositivos-iot';

  listPorUsuario(id_usuario: number): Observable<DispositivoIoT[]> {
    return this.httpClient.get<DispositivoIoT[]>(this.url + '/usuario/' + id_usuario);
  }
  listId(id: number): Observable<DispositivoIoT> {
    return this.httpClient.get<DispositivoIoT>(this.url + '/' + id);
  }
  insert(id_usuario: number, dispositivo: Partial<DispositivoIoT>): Observable<DispositivoIoT> {
    return this.httpClient.post<DispositivoIoT>(this.url, dispositivo, { params: { id_usuario } });
  }
  // nombre, estado (HABILITADO / DESHABILITADO) y nivel_bateria
  update(id: number, dispositivo: Partial<DispositivoIoT>): Observable<DispositivoIoT> {
    return this.httpClient.put<DispositivoIoT>(this.url + '/' + id, dispositivo);
  }
  // tipos_anomalia: texto separado por comas
  configurarAnomalias(id: number, tipos_anomalia: string): Observable<DispositivoIoT> {
    return this.httpClient.put<DispositivoIoT>(this.url + '/' + id + '/anomalias', null, { params: { tipos_anomalia } });
  }
  sincronizar(id: number): Observable<DispositivoIoT> {
    return this.httpClient.put<DispositivoIoT>(this.url + '/' + id + '/sincronizar', null);
  }
  sincronizarTodos(id_usuario: number): Observable<DispositivoIoT[]> {
    return this.httpClient.put<DispositivoIoT[]>(this.url + '/usuario/' + id_usuario + '/sincronizar', null);
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
