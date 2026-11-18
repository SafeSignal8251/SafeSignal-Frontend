import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ZonaRiesgoService } from '../../../services/zona-riesgo-service';
import { ZonaRiesgo } from '../../../model/zona-riesgo';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [FormsModule, MatButton, MatIcon],
  selector: 'app-umbrales-riesgo-component',
  styleUrl: './umbrales-riesgo-component.css',
  templateUrl: './umbrales-riesgo-component.html',
})
export class UmbralesRiesgoComponent {
  zonaService: ZonaRiesgoService = inject(ZonaRiesgoService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  zonas: ZonaRiesgo[] = [];
  busqueda: string = '';
  zona: ZonaRiesgo | null = null;

  // Valores que se editan en pantalla
  altoMin: number = 15;
  bajoMax: number = 5;
  ventana: number = 1;
  radioGeocerca: number = 500;

  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.zonaService.list().subscribe({
      next: (z) => {
        this.zonas = z;
        const actual = this.zona ? z.find((x) => x.id_zona === this.zona?.id_zona) : null;
        this.elegir(actual ?? z[0] ?? null);
        this.cdr.markForCheck();
      },
      error: (e) => this.fallo(e),
    });
  }

  private fallo(e: any) {
    this.error = mensajeError(e);
    this.mensaje = '';
    this.cdr.markForCheck();
  }

  get filtradas(): ZonaRiesgo[] {
    const t = this.busqueda.trim().toLowerCase();
    return this.zonas.filter((z) => t === '' || z.nombre.toLowerCase().includes(t));
  }

  // Reglas del backend: bajo máx < medio mín <= medio máx < alto mín
  get medioMin(): number { return this.bajoMax + 1; }
  get medioMax(): number { return this.altoMin - 1; }

  get criticas(): number { return this.zonas.filter((z) => z.nivel_riesgo === 'ALTO').length; }
  get estables(): number { return this.zonas.filter((z) => z.nivel_riesgo !== 'ALTO').length; }

  elegir(z: ZonaRiesgo | null) {
    this.zona = z;
    if (z) {
      this.altoMin = z.umbral_alto_min ?? 15;
      this.bajoMax = z.umbral_bajo_max ?? 5;
      this.ventana = z.ventana_dias ?? 1;
      this.radioGeocerca = z.radio_geocerca ?? 500;
    }
  }

  elegirPorId(id: string) {
    this.elegir(this.zonas.find((z) => z.id_zona === Number(id)) ?? null);
  }

  restablecer() {
    this.altoMin = 15;
    this.bajoMax = 5;
    this.ventana = 1;
    this.radioGeocerca = 500;
    this.mensaje = 'Valores por defecto restablecidos. Pulsa «Guardar cambios» para aplicarlos.';
    this.error = '';
  }

  guardar() {
    if (!this.zona) {
      return;
    }
    if (this.altoMin <= this.bajoMax + 1) {
      this.fallo({ error: { message: 'El umbral de riesgo alto debe ser mayor que el rango medio.' } });
      return;
    }
    const id = this.zona.id_zona;
    this.zonaService
      .configurarUmbrales(id, {
        umbral_alto_min: this.altoMin,
        umbral_medio_max: this.medioMax,
        umbral_medio_min: this.medioMin,
        umbral_bajo_max: this.bajoMax,
        ventana_dias: this.ventana,
        radio_geocerca: this.radioGeocerca,
      })
      .subscribe({
        next: () => {
          this.zonaService.recalcular(id).subscribe({
            next: () => {
              this.mensaje = 'Umbrales guardados y nivel de riesgo recalculado para «' + this.zona?.nombre + '».';
              this.error = '';
              this.cargar();
            },
            error: (e) => this.fallo(e),
          });
        },
        error: (e) => this.fallo(e),
      });
  }
}
