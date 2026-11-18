import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { ContactoService } from '../../../services/contacto-service';
import { ContactoConfianza } from '../../../model/contacto-confianza';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatButton, MatIcon],
  selector: 'app-agregar-contacto-dialog-component',
  styleUrl: './agregar-contacto-dialog-component.css',
  templateUrl: './agregar-contacto-dialog-component.html',
})
export class AgregarContactoDialogComponent {
  datos: { contacto: ContactoConfianza | null } = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<AgregarContactoDialogComponent> = inject(MatDialogRef);
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  contactoService: ContactoService = inject(ContactoService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  edicion: boolean = this.datos.contacto !== null;
  contactoForm: FormGroup;
  cargando: boolean = false;
  error: string = '';

  constructor() {
    this.contactoForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: [''],
      telefono: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{7,15}$/)]],
      parentesco: [''],
      prioridad: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      notificar_sms: [true],
      notificar_whatsapp: [false],
    });
    if (this.datos.contacto) {
      this.contactoForm.patchValue(this.datos.contacto);
    }
  }

  guardar() {
    if (this.contactoForm.invalid) {
      this.contactoForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const contacto = this.contactoForm.value;
    const peticion = this.datos.contacto
      ? this.contactoService.update(this.datos.contacto.id_contacto, contacto)
      : this.contactoService.insert(this.auth.usuarioId(), contacto);
    peticion.subscribe({
      next: () => this.dialogRef.close(true),
      error: (e) => {
        this.cargando = false;
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
