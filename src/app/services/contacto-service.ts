import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContactoConfianza } from '../model/contacto-confianza';

@Service()
export class ContactoService {
  private httpClient: HttpClient = inject(HttpClient);
  private url = environment.apiURL + '/contactos-confianza';

  listPorUsuario(id_usuario: number): Observable<ContactoConfianza[]> {
    return this.httpClient.get<ContactoConfianza[]>(this.url + '/usuario/' + id_usuario);
  }
  listId(id: number): Observable<ContactoConfianza> {
    return this.httpClient.get<ContactoConfianza>(this.url + '/' + id);
  }
  insert(id_usuario: number, contacto: Partial<ContactoConfianza>): Observable<ContactoConfianza> {
    return this.httpClient.post<ContactoConfianza>(this.url, contacto, { params: { id_usuario } });
  }
  update(id: number, contacto: Partial<ContactoConfianza>): Observable<ContactoConfianza> {
    return this.httpClient.put<ContactoConfianza>(this.url + '/' + id, contacto);
  }
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(this.url + '/' + id);
  }
}
