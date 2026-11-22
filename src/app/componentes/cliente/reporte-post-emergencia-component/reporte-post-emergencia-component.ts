import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../../services/auth-service';
import { AlertaService } from '../../../services/alerta-service';
import { IncidenteService } from '../../../services/incidente-service';
import { Alerta } from '../../../model/alerta';
import { mensajeError } from '../../../core/mensajes';

// HU-16: reporte de incidente post-emergencia (se elige sobre cuál de mis alertas se hace)
@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MatButton],
  selector: 'app-reporte-post-emergencia-component',
  styleUrl: './reporte-post-emergencia-component.css',
  templateUrl: './reporte-post-emergencia-component.html',
})
export class ReportePostEmergenciaComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  alertaService: AlertaService = inject(AlertaService);
  incidenteService: IncidenteService = inject(IncidenteService);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  alertas: Alerta[] = [];
  form: FormGroup;
  cargando: boolean = false;
  error: string = '';

  estados = ['Resuelto', 'Falsa alarma', 'Requiere denuncia'];
  tipos = [
    'Robo / Asalto a mano armada',
    'Arrebato de celular',
    'Intento de acoso',
    'Sospecha',
    'Falla de alumbrado / Vía peligrosa',
    'Accidente vehicular',
    'Otro',
  ];
  gravedades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor() {
    this.form = this.fb.group({
      id_alerta: [null, Validators.required],
      estado: ['', Validators.required],
      tipo: ['', Validators.required],
      autoridades: ['', Validators.required],
      gravedad: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      descripcion: ['', [Validators.required, Validators.maxLength(400)]],
    });
  }

  ngOnInit() {
    this.alertaService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (lista) => {
        this.alertas = [...lista].sort((a, b) => (b.fecha_hora ?? '').localeCompare(a.fecha_hora ?? ''));
        const pedida = Number(this.route.snapshot.queryParamMap.get('alerta'));
        if (pedida > 0 && this.alertas.some((a) => a.id_alerta === pedida)) {
          this.form.patchValue({ id_alerta: pedida });
        }
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completa los campos obligatorios del reporte: alerta, estado, tipo, autoridades y descripción.';
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.form.value;
    // El backend guarda una sola descripción: el estado, el tipo, las autoridades y la gravedad van dentro del texto
    const texto =
      '[Post-emergencia · ' + v.tipo + '] Estado: ' + v.estado + '. Intervinieron autoridades: ' + v.autoridades +
      '. Gravedad: ' + v.gravedad + '/10. ' + String(v.descripcion).trim();
    this.incidenteService.postEmergencia(this.auth.usuarioId(), Number(v.id_alerta), texto).subscribe({
      next: () => this.router.navigate(['/reportes']),
      error: (e) => this.fallo(e),
    });
  }
}
