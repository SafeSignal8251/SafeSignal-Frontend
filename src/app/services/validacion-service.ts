import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ValidacionIncidente } from '../model/validacion-incidente';

@Service()
export class ValidacionService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/validaciones-incidente';

  listPorIncidente(id_incidente: number): Observable<ValidacionIncidente[]> {
    return this.httpClient.get<ValidacionIncidente[]>(this.url + '/incidente/' + id_incidente);
  }
  // tipo_voto: 'CONFIRMADO' o 'FALSA_ALARMA'
  insert(id_incidente: number, id_usuario: number, tipo_voto: string): Observable<ValidacionIncidente> {
    return this.httpClient.post<ValidacionIncidente>(this.url, null, { params: { id_incidente, id_usuario, tipo_voto } });
  }
  contarVotos(id_incidente: number, tipo_voto: string): Observable<number> {
    return this.httpClient.get<number>(this.url + '/incidente/' + id_incidente + '/votos', { params: { tipo_voto } });
  }
}
