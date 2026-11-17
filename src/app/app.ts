import { Component, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { filter } from 'rxjs';
import { AuthService } from './services/auth-service';
import { NavClienteComponent } from './componentes/compartido/nav-cliente-component/nav-cliente-component';
import { NavAdminComponent } from './componentes/compartido/nav-admin-component/nav-admin-component';

@Component({
  imports: [
    RouterOutlet,
    AsyncPipe,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    NavClienteComponent,
    NavAdminComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);

  // El menú lateral es fijo y solo scrollea el contenido (ver app.css).
  // Al cambiar de pantalla el contenido vuelve arriba, como pasaba antes con el scroll de la ventana.
  contenido = viewChild(MatDrawerContent);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.contenido()?.getElementRef().nativeElement.scrollTo({ top: 0 });
    });
  }
}
