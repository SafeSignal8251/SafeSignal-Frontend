import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SuscripcionZona } from '../model/suscripcion-zona';

@Service()
export class SuscripcionZonaService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/suscripciones-zona';

  listPorUsuario(id_usuario: number): Observable<SuscripcionZona[]> {
    return this.httpClient.get<SuscripcionZona[]>(this.url + '/usuario/' + id_usuario);
  }
  insert(id_usuario: number, id_zona: number | null, suscripcion: Partial<SuscripcionZona>): Observable<SuscripcionZona> {
    // Sin zona detectada, el backend usa la más cercana o crea una
    const params: { [k: string]: number } = id_zona != null ? { id_usuario, id_zona } : { id_usuario };
    return this.httpClient.post<SuscripcionZona>(this.url, suscripcion, { params });
  }
  update(id: number, suscripcion: Partial<SuscripcionZona>): Observable<SuscripcionZona> {
    return this.httpClient.put<SuscripcionZona>(this.url + '/' + id, suscripcion);
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
