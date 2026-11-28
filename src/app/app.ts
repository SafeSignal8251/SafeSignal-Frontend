import { Component, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { AuthService } from './services/auth-service';
import { SeguimientoAutomaticoService } from './services/seguimiento-automatico-service';
import { NavClienteComponent } from './componentes/compartido/nav-cliente-component/nav-cliente-component';
import { NavAdminComponent } from './componentes/compartido/nav-admin-component/nav-admin-component';

@Component({
  imports: [
    RouterOutlet,
    AsyncPipe,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    MatIconButton,
    MatIcon,
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

  seguimientoAuto: SeguimientoAutomaticoService = inject(SeguimientoAutomaticoService);

  // Diseño responsivo: en pantallas de hasta 900 px el menú lateral pasa a ser un panel que se abre con el botón de menú
  esMovil = toSignal(inject(BreakpointObserver).observe('(max-width: 900px)').pipe(map((r) => r.matches)), { initialValue: false });
  menuAbierto = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.seguimientoAuto.actualizar(); // HU-23: seguimiento automático al salir de una zona segura
      this.contenido()?.getElementRef().nativeElement.scrollTo({ top: 0 });
      this.menuAbierto.set(false); // en el celular el menú se cierra al elegir una pantalla
    });
  }
}
