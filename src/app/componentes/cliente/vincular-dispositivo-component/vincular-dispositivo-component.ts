import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { DispositivoService } from '../../../services/dispositivo-service';
import { DispositivoIoT } from '../../../model/dispositivo-iot';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatButton, MatIcon],
  selector: 'app-vincular-dispositivo-component',
  styleUrl: './vincular-dispositivo-component.css',
  templateUrl: './vincular-dispositivo-component.html',
})
export class VincularDispositivoComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  dispositivoService: DispositivoService = inject(DispositivoService);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  // Catálogo de dispositivos compatibles (el navegador no puede escanear Bluetooth de forma estándar)
  catalogo = [
    { tipo: 'BOTON_SOS', nombre: 'SafeSignal Botón SOS', detalle: 'Pulsador de pánico personal', icono: 'shield', etiqueta: 'Lista para enlazar' },
    { tipo: 'PULSERA', nombre: 'SafeWatch Pulsera', detalle: 'Pulsera inteligente de emergencia', icono: 'watch', etiqueta: '' },
    { tipo: 'SENSOR_MOVIMIENTO', nombre: 'Sensor de Movimiento', detalle: 'Sensor para el hogar', icono: 'sensors', etiqueta: '' },
  ];

  vinculoForm: FormGroup;
  elegido: { tipo: string; nombre: string; detalle: string } | null = null;
  vinculado: DispositivoIoT | null = null;
  fallo: boolean = false;
  cargando: boolean = false;
  error: string = '';
  mensajePrueba: string = '';

  constructor() {
    this.vinculoForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo_dispositivo: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  vincular(item: { tipo: string; nombre: string; detalle: string }) {
    this.elegido = item;
    this.fallo = false;
    this.error = '';
    this.vinculoForm.patchValue({ nombre: item.nombre });
  }

  confirmar() {
    if (!this.elegido) {
      return;
    }
    if (this.vinculoForm.invalid) {
      this.vinculoForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.vinculoForm.value;
    this.dispositivoService
      .insert(this.auth.usuarioId(), { tipo_dispositivo: this.elegido.tipo, nombre: v.nombre, codigo_dispositivo: v.codigo_dispositivo })
      .subscribe({
        next: (d) => {
          this.cargando = false;
          this.vinculado = d;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.cargando = false;
          this.fallo = true;
          this.error = mensajeError(e);
          this.cdr.markForCheck();
        },
      });
  }

  reintentar() {
    this.fallo = false;
    this.error = '';
  }

  pruebaSenal() {
    if (!this.vinculado) {
      return;
    }
    this.dispositivoService.sincronizar(this.vinculado.id_dispositivo).subscribe({
      next: () => {
        this.mensajePrueba = 'Señal recibida correctamente. El dispositivo responde.';
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.mensajePrueba = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }
}
