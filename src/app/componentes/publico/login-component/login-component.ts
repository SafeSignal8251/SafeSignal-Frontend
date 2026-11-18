import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { mensajeError } from '../../../core/mensajes';
import { PublicoHeaderComponent } from '../../compartido/publico-header-component/publico-header-component';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    PublicoHeaderComponent,
  ],
  selector: 'app-login-component',
  styleUrl: './login-component.css',
  templateUrl: './login-component.html',
})
export class LoginComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  // El proyecto no usa zone.js, por eso se avisa a Angular cuando cambia algo desde un subscribe
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  loginForm: FormGroup;
  tipo: string = 'CLIENTE'; // CLIENTE o ADMIN (así lo guarda el backend en el campo rol)
  verPassword: boolean = false;
  cargando: boolean = false;
  error: string = '';
  aviso: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      dni: ['', [Validators.pattern(/^[0-9]{8}$/)]],
      contrasena: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('registrado')) {
      this.aviso = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
    }
    if (params.get('clave')) {
      this.aviso = 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.';
    }
  }

  cambiarTipo(tipo: string) {
    this.tipo = tipo;
    this.error = '';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    this.aviso = '';
    const datos = this.loginForm.value;
    this.auth.login(datos.correo, datos.dni, datos.contrasena, this.tipo).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate([this.auth.esAdmin() ? '/admin/dashboard' : '/dashboard']);
      },
      error: (e) => {
        this.cargando = false;
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }
}
