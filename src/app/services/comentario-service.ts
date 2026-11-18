import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comentario } from '../model/comentario';

@Service()
export class ComentarioService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/comentarios';

  listPorIncidente(id_incidente: number): Observable<Comentario[]> {
    return this.httpClient.get<Comentario[]>(this.url + '/incidente/' + id_incidente);
  }
  insert(id_usuario: number, id_incidente: number, texto: string): Observable<Comentario> {
    return this.httpClient.post<Comentario>(this.url, { texto }, { params: { id_usuario, id_incidente } });
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
