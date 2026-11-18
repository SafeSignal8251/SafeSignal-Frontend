import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { IncidenteService } from '../../../services/incidente-service';
import { FiltroGuardadoService } from '../../../services/filtro-guardado-service';
import { Incidente } from '../../../model/incidente';
import { FiltroGuardado } from '../../../model/filtro-guardado';
import { mensajeError } from '../../../core/mensajes';
import { ConfirmarDialogComponent } from '../../compartido/confirmar-dialog-component/confirmar-dialog-component';
import { FiltrosGuardadosDialogComponent } from '../../compartido/filtros-guardados-dialog-component/filtros-guardados-dialog-component';

@Component({
  imports: [FormsModule, MatButton],
  selector: 'app-estadisticas-component',
  styleUrl: './estadisticas-component.css',
  templateUrl: './estadisticas-component.html',
})
export class EstadisticasComponent {
  auth: AuthService = inject(AuthService);
  incidenteService: IncidenteService = inject(IncidenteService);
  filtroService: FiltroGuardadoService = inject(FiltroGuardadoService);
  dialog: MatDialog = inject(MatDialog);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  distrito: string = '';
  tipologia: string = '';
  dias: string = '30';

  incidentes: Incidente[] = [];
  distritos: string[] = [];
  tipologias: string[] = [];

  // datos de los gráficos
  semanas: { etiqueta: string; total: number }[] = [];
  puntosLinea: string = '';
  puntosCirculo: { x: number; y: number }[] = [];
  donut: { color: string; dash: string; offset: number; etiqueta: string; total: number; pct: number }[] = [];
  barras: { tipo: string; total: number; pct: number }[] = [];
  readonly circunferencia: number = 2 * Math.PI * 60;

  mensaje: string = '';
  error: string = '';

  ngOnInit() {
    // Se cargan primero todos los incidentes para armar las listas de distritos y tipologías
    this.incidenteService.filtrar().subscribe({
      next: (todos) => {
        this.distritos = [...new Set(todos.map((i) => i.distrito).filter((x) => !!x))];
        this.tipologias = [...new Set(todos.map((i) => i.tipo_incidente).filter((x) => !!x))];
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.aplicar();
  }

  aplicar() {
    this.incidenteService.filtrar(this.distrito, this.tipologia, Number(this.dias) || undefined).subscribe({
      next: (lista) => {
        this.incidentes = lista;
        this.calcular();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  get total(): number {
    return this.incidentes.length;
  }
  get altos(): number {
    return this.incidentes.filter((i) => i.nivel_riesgo === 'ALTO').length;
  }
  get verificados(): number {
    return this.incidentes.filter((i) => i.estado === 'VERIFICADO').length;
  }
  get porcentajeVerificados(): number {
    return this.total === 0 ? 0 : Math.round((this.verificados / this.total) * 100);
  }
  // índice de riesgo de 0 a 10: ALTO = 10, MEDIO = 5, BAJO = 1
  get indice(): number {
    if (this.total === 0) {
      return 0;
    }
    const suma = this.incidentes.reduce((a, i) => a + (i.nivel_riesgo === 'ALTO' ? 10 : i.nivel_riesgo === 'MEDIO' ? 5 : 1), 0);
    return Math.round((suma / this.total) * 10) / 10;
  }

  private calcular() {
    // --- Evolución por semanas (últimas 4) ---
    const ahora = Date.now();
    const semana = 7 * 86400000;
    this.semanas = [3, 2, 1, 0].map((n) => {
      const hasta = ahora - n * semana;
      const desde = hasta - semana;
      const total = this.incidentes.filter((i) => {
        const t = new Date(i.fecha_hora).getTime();
        return t > desde && t <= hasta;
      }).length;
      return { etiqueta: 'Semana ' + (4 - n), total };
    });
    const max = Math.max(1, ...this.semanas.map((s) => s.total));
    this.puntosCirculo = this.semanas.map((s, idx) => ({ x: 30 + idx * 113, y: 140 - (s.total / max) * 110 }));
    this.puntosLinea = this.puntosCirculo.map((p) => p.x + ',' + p.y).join(' ');

    // --- Dona por nivel de gravedad ---
    const niveles = [
      { nivel: 'ALTO', color: '#c0392b', etiqueta: 'Alto riesgo crítico' },
      { nivel: 'MEDIO', color: '#1a5a9a', etiqueta: 'Riesgo moderado' },
      { nivel: 'BAJO', color: '#7cb8f5', etiqueta: 'Riesgo bajo / preventivo' },
    ];
    let acumulado = 0;
    this.donut = niveles.map((n) => {
      const cantidad = this.incidentes.filter((i) => i.nivel_riesgo === n.nivel).length;
      const largo = this.total === 0 ? 0 : (cantidad / this.total) * this.circunferencia;
      const item = {
        color: n.color,
        dash: largo + ' ' + (this.circunferencia - largo),
        offset: -acumulado,
        etiqueta: n.etiqueta,
        total: cantidad,
        pct: this.total === 0 ? 0 : Math.round((cantidad / this.total) * 100),
      };
      acumulado += largo;
      return item;
    });

    // --- Tipología más frecuente ---
    const conteo: { [tipo: string]: number } = {};
    for (const i of this.incidentes) {
      const t = i.tipo_incidente || 'Sin tipo';
      conteo[t] = (conteo[t] ?? 0) + 1;
    }
    const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const mayor = top.length > 0 ? top[0][1] : 1;
    this.barras = top.map(([tipo, cant]) => ({ tipo, total: cant, pct: Math.round((cant / mayor) * 100) }));
  }

  guardarFiltro() {
    this.dialog
      .open(ConfirmarDialogComponent, {
        width: '440px',
        data: {
          titulo: 'Guardar filtro actual',
          mensaje: 'Ponle un nombre para reutilizarlo después.',
          icono: 'bookmark',
          pedirTexto: true,
          textoObligatorio: true,
          etiquetaTexto: 'Nombre del filtro',
          textoConfirmar: 'Guardar',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r) {
          const filtro: Partial<FiltroGuardado> = {
            nombre: r.texto,
            distrito: this.distrito,
            tipologia: this.tipologia,
            rango_dias: Number(this.dias) || 0,
          };
          this.filtroService.insert(this.auth.usuarioId(), filtro).subscribe({
            next: () => {
              this.mensaje = 'Filtro guardado.';
              this.error = '';
              this.cdr.markForCheck();
            },
            error: (e) => {
              this.error = mensajeError(e);
              this.cdr.markForCheck();
            },
          });
        }
      });
  }

  filtrosGuardados() {
    this.filtroService.listPorUsuario(this.auth.usuarioId()).subscribe({
      next: (filtros) => {
        this.dialog
          .open(FiltrosGuardadosDialogComponent, { width: '560px', data: { filtros } })
          .afterClosed()
          .subscribe((f: FiltroGuardado | null) => {
            if (f) {
              this.distrito = f.distrito ?? '';
              this.tipologia = f.tipologia ?? '';
              this.dias = f.rango_dias ? String(f.rango_dias) : '';
              this.aplicar();
            }
          });
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  // El navegador permite "Guardar como PDF" desde el cuadro de impresión
  exportarPdf() {
    window.print();
  }
}
