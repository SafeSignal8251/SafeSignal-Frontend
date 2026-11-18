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
import { Router, RouterLink } from '@angular/router';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { UsuarioService } from '../../../services/usuario-service';
import { mensajeError } from '../../../core/mensajes';
import { PublicoHeaderComponent } from '../../compartido/publico-header-component/publico-header-component';

// Valida a nivel de formulario que las dos contraseñas sean iguales
const contrasenasIguales: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  return grupo.get('contrasena')?.value === grupo.get('confirmar')?.value ? null : { noCoinciden: true };
};

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
  selector: 'app-registro-component',
  styleUrl: './registro-component.css',
  templateUrl: './registro-component.html',
})
export class RegistroComponent {
  fb: FormBuilder = inject(FormBuilder);
  usuarioService: UsuarioService = inject(UsuarioService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  registroForm: FormGroup;
  verPassword: boolean = false;
  verConfirmar: boolean = false;
  cargando: boolean = false;
  error: string = '';

  distritos: string[] = [
    'Ate', 'Barranco', 'Breña', 'Callao', 'Chorrillos', 'Comas', 'Jesús María', 'La Molina',
    'La Victoria', 'Lima Cercado', 'Lince', 'Magdalena del Mar', 'Miraflores', 'Pueblo Libre',
    'Rímac', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
    'San Miguel', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
  ];

  constructor() {
    this.registroForm = this.fb.group(
      {
        nombreCompleto: ['', [Validators.required, Validators.pattern(/^\S+(\s+\S+)+$/)]],
        correo: ['', [Validators.required, Validators.email]],
        dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
        telefono: ['', [Validators.pattern(/^\+?[0-9 ]{9,15}$/)]],
        distrito: ['', Validators.required],
        contrasena: ['', [Validators.required, Validators.minLength(8)]],
        confirmar: ['', Validators.required],
        aceptaTerminos: [false, Validators.requiredTrue], // HU-45
      },
      { validators: contrasenasIguales }
    );
  }

  // El mockup tiene un solo campo "Nombres y Apellidos", pero el backend pide los dos por separado.
  // Regla: con 3 o más palabras, las 2 últimas son los apellidos (ej. "Juan Pérez Ramos").
  private separarNombre(completo: string) {
    const partes = completo.trim().split(/\s+/);
    const cantApellidos = partes.length >= 3 ? 2 : 1;
    return {
      nombres: partes.slice(0, partes.length - cantApellidos).join(' '),
      apellidos: partes.slice(partes.length - cantApellidos).join(' '),
    };
  }

  onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.registroForm.value;
    const nombre = this.separarNombre(v.nombreCompleto);
    const usuario = {
      nombres: nombre.nombres,
      apellidos: nombre.apellidos,
      correo: v.correo,
      dni: v.dni,
      telefono: v.telefono,
      distrito: v.distrito,
      contrasena: v.contrasena,
    };
    this.usuarioService.registrar(usuario).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/login'], { queryParams: { registrado: 1 } });
      },
      error: (e) => {
        this.cargando = false;
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }
}
