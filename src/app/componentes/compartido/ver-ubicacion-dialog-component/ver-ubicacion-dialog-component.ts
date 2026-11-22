import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MapaComponent } from '../mapa-component/mapa-component';

// HU-14: «Ver Ruta». Muestra en un mapa el punto de una alerta para que el administrador despache la unidad.
@Component({
  imports: [MatDialogTitle, MatDialogContent, MatButton, MatIcon, MapaComponent],
  selector: 'app-ver-ubicacion-dialog-component',
  styleUrl: './ver-ubicacion-dialog-component.css',
  templateUrl: './ver-ubicacion-dialog-component.html',
})
export class VerUbicacionDialogComponent {
  datos: { titulo: string; codigo: string; direccion: string; lat: number; lng: number } = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<VerUbicacionDialogComponent> = inject(MatDialogRef);

  get enlaceMapa(): string {
    return 'https://www.openstreetmap.org/?mlat=' + this.datos.lat + '&mlon=' + this.datos.lng + '#map=17/' + this.datos.lat + '/' + this.datos.lng;
  }

  cerrar() {
    this.dialogRef.close();
  }
}
