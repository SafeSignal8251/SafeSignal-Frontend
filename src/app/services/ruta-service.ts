import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ruta } from '../model/ruta';

@Service()
export class RutaService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/rutas';

  listPorUsuario(id_usuario: number): Observable<Ruta[]> {
    return this.httpClient.get<Ruta[]>(this.url + '/usuario/' + id_usuario);
  }
  listId(id: number): Observable<Ruta> {
    return this.httpClient.get<Ruta>(this.url + '/' + id);
  }
  insert(id_usuario: number, ruta: Partial<Ruta>): Observable<Ruta> {
    return this.httpClient.post<Ruta>(this.url, ruta, { params: { id_usuario } });
  }
  update(id: number, ruta: Partial<Ruta>): Observable<Ruta> {
    return this.httpClient.put<Ruta>(this.url + '/' + id, ruta);
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
  // Devuelve { id_ruta, nombre, incidentes_cercanos, nivel_riesgo }
  evaluarRiesgo(id: number): Observable<any> {
    return this.httpClient.get<any>(this.url + '/' + id + '/riesgo');
  }
  seguras(id_usuario: number): Observable<Ruta[]> {
    return this.httpClient.get<Ruta[]>(this.url + '/usuario/' + id_usuario + '/seguras');
  }
  alternativa(id: number): Observable<Ruta> {
    return this.httpClient.get<Ruta>(this.url + '/' + id + '/alternativa');
  }
}
