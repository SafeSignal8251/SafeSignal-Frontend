import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { UsuarioService } from '../../../services/usuario-service';
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
    MatInput,
    MatButton,
    MatIcon,
    PublicoHeaderComponent,
  ],
  selector: 'app-recuperar-password-component',
  styleUrl: './recuperar-password-component.css',
  templateUrl: './recuperar-password-component.html',
})
export class RecuperarPasswordComponent {
  fb: FormBuilder = inject(FormBuilder);
  usuarioService: UsuarioService = inject(UsuarioService);
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  recuperarForm: FormGroup;
  cargando: boolean = false;
  error: string = '';

  constructor() {
    this.recuperarForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    });
  }

  // Paso 1: el backend verifica que el correo y el DNI pertenezcan a una cuenta.
  // Si es así, se pasa al paso 2 (pantalla "Crear nueva contraseña").
  onSubmit() {
    if (this.recuperarForm.invalid) {
      this.recuperarForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.recuperarForm.value;
    this.usuarioService.recuperarPassword(v.correo, v.dni).subscribe({
      next: () => {
        this.cargando = false;
        this.auth.recuperacion = { correo: v.correo, dni: v.dni };
        this.router.navigate(['/nueva-password']);
      },
      error: (e) => {
        this.cargando = false;
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }
}
