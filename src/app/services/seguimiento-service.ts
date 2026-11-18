import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Seguimiento } from '../model/seguimiento';

@Service()
export class SeguimientoService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/seguimientos';

  listPorUsuario(id_usuario: number): Observable<Seguimiento[]> {
    return this.httpClient.get<Seguimiento[]>(this.url + '/usuario/' + id_usuario);
  }
  activos(id_usuario: number): Observable<Seguimiento[]> {
    return this.httpClient.get<Seguimiento[]>(this.url + '/usuario/' + id_usuario + '/activos');
  }
  // Solo se permite un seguimiento activo por usuario
  insert(id_usuario: number, seguimiento: Partial<Seguimiento>): Observable<Seguimiento> {
    return this.httpClient.post<Seguimiento>(this.url, seguimiento, { params: { id_usuario } });
  }
  finalizar(id: number): Observable<Seguimiento> {
    return this.httpClient.put<Seguimiento>(this.url + '/' + id + '/finalizar', null);
  }
}
