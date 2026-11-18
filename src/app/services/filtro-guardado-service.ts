import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FiltroGuardado } from '../model/filtro-guardado';

@Service()
export class FiltroGuardadoService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/filtros-guardados';

  listPorUsuario(id_usuario: number): Observable<FiltroGuardado[]> {
    return this.httpClient.get<FiltroGuardado[]>(this.url + '/usuario/' + id_usuario);
  }
  insert(id_usuario: number, filtro: Partial<FiltroGuardado>): Observable<FiltroGuardado> {
    return this.httpClient.post<FiltroGuardado>(this.url, filtro, { params: { id_usuario } });
  }
  delete(id: number, id_usuario: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id, { params: { id_usuario } });
  }
}
