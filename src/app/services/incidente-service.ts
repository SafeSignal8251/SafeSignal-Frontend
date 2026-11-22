import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Incidente } from '../model/incidente';

@Service()
export class IncidenteService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/incidentes';

  list(): Observable<Incidente[]> {
    return this.httpClient.get<Incidente[]>(this.url);
  }
  listId(id: number): Observable<Incidente> {
    return this.httpClient.get<Incidente>(this.url + '/' + id);
  }
  listPorUsuario(id_usuario: number): Observable<Incidente[]> {
    return this.httpClient.get<Incidente[]>(this.url + '/usuario/' + id_usuario);
  }
  listPorEstado(estado: string): Observable<Incidente[]> {
    return this.httpClient.get<Incidente[]>(this.url + '/estado/' + estado);
  }
  cercanos(lat: number, lng: number, radio: number): Observable<Incidente[]> {
    return this.httpClient.get<Incidente[]>(this.url + '/cercanos', { params: { lat, lng, radio } });
  }
  // distrito, tipologia y dias son opcionales
  filtrar(distrito?: string, tipologia?: string, dias?: number): Observable<Incidente[]> {
    const params: any = {};
    if (distrito) { params['distrito'] = distrito; }
    if (tipologia) { params['tipologia'] = tipologia; }
    if (dias) { params['dias'] = dias; }
    return this.httpClient.get<Incidente[]>(this.url + '/filtrar', { params });
  }
  // El backend exige tanto la zona como el usuario
  insert(id_zona: number | null, id_usuario: number, incidente: Partial<Incidente>): Observable<Incidente> {
    // Si no hay zona detectada, el backend usa la más cercana o crea una
    const params: { [k: string]: number } = id_zona != null ? { id_zona, id_usuario } : { id_usuario };
    return this.httpClient.post<Incidente>(this.url, incidente, { params });
  }
  // HU-16: reporte después de una emergencia, asociado a una alerta propia
  postEmergencia(id_usuario: number, id_alerta: number, descripcion: string): Observable<Incidente> {
    return this.httpClient.post<Incidente>(this.url + '/post-emergencia', null, { params: { id_usuario, id_alerta, descripcion } });
  }
  // Solo se puede editar la descripción de un reporte propio
  update(id: number, id_usuario: number, descripcion: string): Observable<Incidente> {
    return this.httpClient.put<Incidente>(this.url + '/' + id, { descripcion }, { params: { id_usuario } });
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
  // ---- Solo administrador ----
  denunciados(): Observable<Incidente[]> {
    return this.httpClient.get<Incidente[]>(this.url + '/denunciados');
  }
  moderar(id: number, descartar: boolean): Observable<Incidente> {
    return this.httpClient.put<Incidente>(this.url + '/' + id + '/moderar', null, { params: { descartar } });
  }
  cambiarEstado(id: number, estado: string): Observable<Incidente> {
    return this.httpClient.put<Incidente>(this.url + '/' + id + '/estado', null, { params: { estado } });
  }
}
