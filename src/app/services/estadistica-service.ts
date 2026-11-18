import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadisticaPublicada } from '../model/estadistica-publicada';

@Service()
export class EstadisticaService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/estadisticas';

  list(): Observable<EstadisticaPublicada[]> {
    return this.httpClient.get<EstadisticaPublicada[]>(this.url);
  }
  // ---- Solo administrador ----
  insert(id_usuario: number, estadistica: Partial<EstadisticaPublicada>): Observable<EstadisticaPublicada> {
    return this.httpClient.post<EstadisticaPublicada>(this.url, estadistica, { params: { id_usuario } });
  }
  // Devuelve { total_usuarios, total_incidentes, incidentes_pendientes, incidentes_verificados, alertas_activas, zonas_riesgo_alto, ... }
  dashboard(id_usuario: number, distrito?: string): Observable<any> {
    const params: any = { id_usuario };
    if (distrito) { params['distrito'] = distrito; }
    return this.httpClient.get<any>(this.url + '/dashboard', { params });
  }
  // El backend responde un CSV como texto
  exportar(id: number): Observable<string> {
    return this.httpClient.get(this.url + '/' + id + '/exportar', { responseType: 'text' });
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
