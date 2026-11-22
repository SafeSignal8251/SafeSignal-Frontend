import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../services/auth-service';
import { EstadisticaService } from '../../../services/estadistica-service';
import { IncidenteService } from '../../../services/incidente-service';
import { EstadisticaPublicada } from '../../../model/estadistica-publicada';
import { Incidente } from '../../../model/incidente';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [ReactiveFormsModule, DatePipe, MatButton, MatIcon],
  selector: 'app-estadisticas-globales-component',
  styleUrl: './estadisticas-globales-component.css',
  templateUrl: './estadisticas-globales-component.html',
})
export class EstadisticasGlobalesComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  estadisticaService: EstadisticaService = inject(EstadisticaService);
  incidenteService: IncidenteService = inject(IncidenteService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  metricaForm: FormGroup;
  publicadas: EstadisticaPublicada[] = [];
  incidentes: Incidente[] = [];
  publicada: EstadisticaPublicada | null = null;
  codigo: string = this.nuevoCodigo();
  distritos: string[] = [];
  seleccionados: string[] = [];
  guardando: boolean = false;
  error: string = '';

  categorias = ['Delitos de alto impacto', 'Respuesta operativa', 'Falsas alarmas', 'Despacho policial'];
  variables = [
    { clave: 'DENSIDAD', titulo: 'Tasa de incidentes por km² (densidad geoespacial)', formula: '[Total_Incidentes_Validados] / [Superficie_Cuadrante_km2]', activa: true },
    { clave: 'TIEMPO_AUXILIO', titulo: 'Tiempo medio de auxilio Serenazgo / PNP 105 (SLA)', formula: '[Hora_Arribo_Unidad] - [Hora_Emision_Alerta_SOS]', activa: true },
    { clave: 'FALSAS_ALARMAS', titulo: 'Tasa de falsas alarmas con sanción', formula: '([Falsas_Alarmas] / [Total_Despachos]) * 100', activa: true },
    { clave: 'REINCIDENCIA', titulo: 'Índice de reincidencia delictiva por cuadrante', formula: '[Incidentes_Mismo_Radio_100m] en intervalo < 7 días', activa: false },
  ];

  constructor() {
    this.metricaForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      categoria: ['Delitos de alto impacto', Validators.required],
      radio: ['Geocerca estricta por límite distrital INEI'],
      rango: ['Últimos 30 días móviles'],
      granularidad: ['Bloques horarios (cada 3 horas)'],
      franja: ['19:00 - 23:00 hrs (Pico Nocturno)'],
    });
  }

  ngOnInit() {
    this.cargar();
    this.incidenteService.list().subscribe({
      next: (lista) => {
        this.incidentes = lista.filter((i) => i.estado !== 'ELIMINADO');
        this.distritos = [...new Set(lista.map((i) => i.distrito).filter((d) => !!d))];
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  private nuevoCodigo(): string {
    return 'REP-' + new Date().getFullYear() + '-C5-' + String(Math.floor(Math.random() * 900) + 100);
  }

  cargar() {
    this.estadisticaService.list().subscribe({
      next: (e) => {
        this.publicadas = e;
        this.cdr.markForCheck();
      },
      error: (er) => this.fallo(er),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.guardando = false;
    this.cdr.markForCheck();
  }

  alternarDistrito(d: string) {
    this.seleccionados = this.seleccionados.includes(d) ? this.seleccionados.filter((x) => x !== d) : [...this.seleccionados, d];
  }

  // Barras de la previsualización: incidentes por tipo (los 4 más frecuentes)
  get barras(): { tipo: string; total: number; pct: number }[] {
    const conteo: { [t: string]: number } = {};
    for (const i of this.incidentes) {
      conteo[i.tipo_incidente || 'Sin tipo'] = (conteo[i.tipo_incidente || 'Sin tipo'] ?? 0) + 1;
    }
    const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const max = top.length ? top[0][1] : 1;
    return top.map(([tipo, total]) => ({ tipo, total, pct: Math.round((total / max) * 100) }));
  }

  descartar() {
    this.metricaForm.reset({
      titulo: '', descripcion: '', categoria: 'Delitos de alto impacto',
      radio: 'Geocerca estricta por límite distrital INEI', rango: 'Últimos 30 días móviles',
      granularidad: 'Bloques horarios (cada 3 horas)', franja: '19:00 - 23:00 hrs (Pico Nocturno)',
    });
    this.seleccionados = [];
    this.codigo = this.nuevoCodigo();
    this.publicada = null;
    this.error = '';
  }

  publicar() {
    if (this.metricaForm.invalid) {
      this.metricaForm.markAllAsTouched();
      this.error = 'Completa el título y la descripción del informe.';
      return;
    }
    this.guardando = true;
    this.error = '';
    const v = this.metricaForm.value;
    // Los parámetros del informe se guardan como texto JSON en el campo "parametros"
    const parametros = JSON.stringify({
      distritos: this.seleccionados,
      radio: v.radio,
      rango: v.rango,
      granularidad: v.granularidad,
      franja: v.franja,
      variables: this.variables.filter((x) => x.activa).map((x) => x.clave),
    });
    this.estadisticaService
      .insert(this.auth.usuarioId(), { titulo: v.titulo, descripcion: v.descripcion, categoria: v.categoria, parametros })
      .subscribe({
        next: (e) => {
          this.guardando = false;
          this.publicada = e;
          this.cargar();
          this.cdr.markForCheck();
        },
        error: (er) => this.fallo(er),
      });
  }

  // NO VISTO EN CLASE: Blob y URL.createObjectURL (para descargar el CSV que devuelve el backend)
  // El navegador permite «Guardar como PDF» desde el cuadro de impresión
  descargarPdf() {
    window.print();
  }

  descargar(e: EstadisticaPublicada) {
    this.estadisticaService.exportar(e.id_estadistica).subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = (e.codigo || 'estadistica-' + e.id_estadistica) + '.csv';
        enlace.click();
        URL.revokeObjectURL(url);
      },
      error: (er) => this.fallo(er),
    });
  }
}
