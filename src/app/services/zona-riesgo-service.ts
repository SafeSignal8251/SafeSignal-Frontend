import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZonaRiesgo } from '../model/zona-riesgo';

@Service()
export class ZonaRiesgoService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/zonas-riesgo';

  list(): Observable<ZonaRiesgo[]> {
    return this.httpClient.get<ZonaRiesgo[]>(this.url);
  }
  listActivas(): Observable<ZonaRiesgo[]> {
    return this.httpClient.get<ZonaRiesgo[]>(this.url + '/activas');
  }
  listId(id: number): Observable<ZonaRiesgo> {
    return this.httpClient.get<ZonaRiesgo>(this.url + '/' + id);
  }
  // ---- Solo administrador ----
  insert(zona: Partial<ZonaRiesgo>): Observable<ZonaRiesgo> {
    return this.httpClient.post<ZonaRiesgo>(this.url, zona);
  }
  update(id: number, zona: Partial<ZonaRiesgo>): Observable<ZonaRiesgo> {
    return this.httpClient.put<ZonaRiesgo>(this.url + '/' + id, zona);
  }
  // Regla del backend: umbral_bajo_max < umbral_medio_min <= umbral_medio_max < umbral_alto_min
  configurarUmbrales(id: number, zona: Partial<ZonaRiesgo>): Observable<ZonaRiesgo> {
    return this.httpClient.put<ZonaRiesgo>(this.url + '/' + id + '/umbrales', zona);
  }
  recalcular(id: number): Observable<ZonaRiesgo> {
    return this.httpClient.put<ZonaRiesgo>(this.url + '/' + id + '/recalcular', null);
  }
  cambiarEstado(id: number, estado: boolean): Observable<ZonaRiesgo> {
    return this.httpClient.put<ZonaRiesgo>(this.url + '/' + id + '/estado', null, { params: { estado } });
  }
}
