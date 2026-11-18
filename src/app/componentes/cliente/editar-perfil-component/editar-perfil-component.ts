import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../../services/auth-service';
import { UsuarioService } from '../../../services/usuario-service';
import { ContactoService } from '../../../services/contacto-service';
import { ContactoConfianza } from '../../../model/contacto-confianza';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatButton],
  selector: 'app-editar-perfil-component',
  styleUrl: './editar-perfil-component.css',
  templateUrl: './editar-perfil-component.html',
})
export class EditarPerfilComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  usuarioService: UsuarioService = inject(UsuarioService);
  contactoService: ContactoService = inject(ContactoService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  perfilForm: FormGroup;
  contacto: ContactoConfianza | null = null;
  cargando: boolean = false;
  error: string = '';
  distritos: string[] = [
    'Ate', 'Barranco', 'Breña', 'Callao', 'Chorrillos', 'Comas', 'Jesús María', 'La Molina', 'La Victoria', 'Lima Cercado',
    'Lince', 'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'Rímac', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
    'San Juan de Miraflores', 'San Miguel', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
  ];

  constructor() {
    this.perfilForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: [{ value: '', disabled: true }],
      telefono: ['', Validators.pattern(/^\+?[0-9 ]{9,15}$/)],
      distrito: [''],
      direccion: [''],
      contacto_nombre: [''],
      contacto_telefono: ['', Validators.pattern(/^\+?[0-9 ]{7,15}$/)],
    });
  }

  ngOnInit() {
    const id = this.auth.usuarioId();
    this.usuarioService.listId(id).subscribe({
      next: (u) => {
        this.perfilForm.patchValue(u);
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
    this.contactoService.listPorUsuario(id).subscribe({
      next: (c) => {
        this.contacto = [...c].sort((a, b) => (a.prioridad ?? 9) - (b.prioridad ?? 9))[0] ?? null;
        if (this.contacto) {
          this.perfilForm.patchValue({ contacto_nombre: this.contacto.nombres, contacto_telefono: this.contacto.telefono });
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  onSubmit() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.perfilForm.getRawValue();
    this.usuarioService
      .update(this.auth.usuarioId(), { nombres: v.nombres, apellidos: v.apellidos, telefono: v.telefono, distrito: v.distrito, direccion: v.direccion })
      .subscribe({
        next: () => this.guardarContacto(v),
        error: (e) => this.fallo(e),
      });
  }

  // Los datos de emergencia son el contacto de mayor prioridad: se actualiza o se crea
  private guardarContacto(v: any) {
    const nombre = (v.contacto_nombre ?? '').trim();
    const telefono = (v.contacto_telefono ?? '').trim();
    if (nombre === '' || telefono === '') {
      this.terminar();
      return;
    }
    const peticion = this.contacto
      ? this.contactoService.update(this.contacto.id_contacto, { nombres: nombre, telefono })
      : this.contactoService.insert(this.auth.usuarioId(), { nombres: nombre, telefono, prioridad: 1 });
    peticion.subscribe({
      next: () => this.terminar(),
      error: (e) => this.fallo(e),
    });
  }

  private terminar() {
    this.cargando = false;
    this.router.navigate(['/perfil']);
  }
}
