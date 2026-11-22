import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth-service';
import { FiltroGuardadoService } from '../../../services/filtro-guardado-service';
import { FiltroGuardado } from '../../../model/filtro-guardado';
import { mensajeError } from '../../../core/mensajes';

@Component({
  imports: [FormsModule, MatDialogTitle, MatDialogContent, MatButton, MatIcon],
  selector: 'app-filtros-guardados-dialog-component',
  styleUrl: './filtros-guardados-dialog-component.css',
  templateUrl: './filtros-guardados-dialog-component.html',
})
export class FiltrosGuardadosDialogComponent {
  datos: { filtros: FiltroGuardado[] } = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<FiltrosGuardadosDialogComponent> = inject(MatDialogRef);
  auth: AuthService = inject(AuthService);
  filtroService: FiltroGuardadoService = inject(FiltroGuardadoService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  filtros: FiltroGuardado[] = [...this.datos.filtros];
  error: string = '';
  buscar: string = '';

  get filtrados(): FiltroGuardado[] {
    const t = this.buscar.trim().toLowerCase();
    if (t === '') {
      return this.filtros;
    }
    return this.filtros.filter((f) => ((f.nombre ?? '') + ' ' + (f.distrito ?? '') + ' ' + (f.tipologia ?? '')).toLowerCase().includes(t));
  }

  aplicar(f: FiltroGuardado) {
    this.dialogRef.close(f);
  }

  eliminar(f: FiltroGuardado) {
    this.filtroService.delete(f.id_filtro, this.auth.usuarioId()).subscribe({
      next: () => {
        this.filtros = this.filtros.filter((x) => x.id_filtro !== f.id_filtro);
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = mensajeError(e);
        this.cdr.markForCheck();
      },
    });
  }

  cerrar() {
    this.dialogRef.close(null);
  }
}
