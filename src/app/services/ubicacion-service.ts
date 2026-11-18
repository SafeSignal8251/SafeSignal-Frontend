import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ubicacion } from '../model/ubicacion';

@Service()
export class UbicacionService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/ubicaciones';

  insert(id_seguimiento: number, ubicacion: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.httpClient.post<Ubicacion>(this.url, ubicacion, { params: { id_seguimiento } });
  }
  ultima(id_seguimiento: number): Observable<Ubicacion> {
    return this.httpClient.get<Ubicacion>(this.url + '/seguimiento/' + id_seguimiento + '/ultima');
  }
}
