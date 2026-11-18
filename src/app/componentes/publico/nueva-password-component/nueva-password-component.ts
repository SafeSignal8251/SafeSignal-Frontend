import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { UsuarioService } from '../../../services/usuario-service';
import { AuthService } from '../../../services/auth-service';
import { mensajeError } from '../../../core/mensajes';
import { PublicoHeaderComponent } from '../../compartido/publico-header-component/publico-header-component';

const contrasenasIguales: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  return grupo.get('nueva')?.value === grupo.get('confirmar')?.value ? null : { noCoinciden: true };
};

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    PublicoHeaderComponent,
  ],
  selector: 'app-nueva-password-component',
  styleUrl: './nueva-password-component.css',
  templateUrl: './nueva-password-component.html',
})
export class NuevaPasswordComponent {
  fb: FormBuilder = inject(FormBuilder);
  usuarioService: UsuarioService = inject(UsuarioService);
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  nuevaForm: FormGroup;
  verNueva: boolean = false;
  verConfirmar: boolean = false;
  cargando: boolean = false;
  error: string = '';

  constructor() {
    this.nuevaForm = this.fb.group(
      {
        nueva: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/)]],
        confirmar: ['', Validators.required],
      },
      { validators: contrasenasIguales }
    );
  }

  ngOnInit() {
    // Sin el correo y DNI del paso anterior no se puede restablecer la contraseña
    if (!this.auth.recuperacion) {
      this.router.navigate(['/recuperar-password']);
    }
  }

  // Requisitos que se muestran en la tarjeta "Requisitos de seguridad"
  get tiene8(): boolean {
    return (this.nuevaForm.get('nueva')?.value ?? '').length >= 8;
  }
  get tieneMayusculaYNumero(): boolean {
    const valor: string = this.nuevaForm.get('nueva')?.value ?? '';
    return /[A-Z]/.test(valor) && /[0-9]/.test(valor);
  }
  get coinciden(): boolean {
    const nueva = this.nuevaForm.get('nueva')?.value ?? '';
    return nueva !== '' && nueva === this.nuevaForm.get('confirmar')?.value;
  }

  onSubmit() {
    if (this.nuevaForm.invalid || !this.auth.recuperacion) {
      this.nuevaForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const datos = this.auth.recuperacion;
    this.usuarioService
      .restablecerPassword(datos.correo, datos.dni, this.nuevaForm.value.nueva)
      .subscribe({
        next: () => {
          this.cargando = false;
          this.auth.recuperacion = null;
          this.router.navigate(['/login'], { queryParams: { clave: 1 } });
        },
        error: (e) => {
          this.cargando = false;
          this.error = mensajeError(e);
          this.cdr.markForCheck();
        },
      });
  }
}
