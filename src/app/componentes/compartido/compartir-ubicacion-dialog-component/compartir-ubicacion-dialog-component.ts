import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { ContactoConfianza } from '../../../model/contacto-confianza';

@Component({
  imports: [FormsModule, MatDialogTitle, MatDialogContent, MatButton, MatIcon],
  selector: 'app-compartir-ubicacion-dialog-component',
  styleUrl: './compartir-ubicacion-dialog-component.css',
  templateUrl: './compartir-ubicacion-dialog-component.html',
})
export class CompartirUbicacionDialogComponent {
  datos: { contactos: ContactoConfianza[] } = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<CompartirUbicacionDialogComponent> = inject(MatDialogRef);

  minutos: number = 60;
  geocerca: number = 500;
  opcionesGeocerca = [
    { valor: 250, texto: '250 m' },
    { valor: 500, texto: '500 m (Recomendado)' },
    { valor: 1000, texto: '1 km' },
    { valor: 2000, texto: '2 km' },
  ];
  opciones = [
    { valor: 30, texto: '30 minutos' },
    { valor: 60, texto: '60 minutos (Recomendado)' },
    { valor: 120, texto: '2 horas' },
    { valor: 240, texto: '4 horas' },
  ];

  confirmar() {
    this.dialogRef.close({ minutos: Number(this.minutos), geocerca: Number(this.geocerca) });
  }
  cancelar() {
    this.dialogRef.close(null);
  }
}
