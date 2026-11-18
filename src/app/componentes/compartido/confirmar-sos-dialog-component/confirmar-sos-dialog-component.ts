import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { ContactoConfianza } from '../../../model/contacto-confianza';

@Component({
  imports: [MatDialogTitle, MatDialogContent, MatButton, MatIcon],
  selector: 'app-confirmar-sos-dialog-component',
  styleUrl: './confirmar-sos-dialog-component.css',
  templateUrl: './confirmar-sos-dialog-component.html',
})
export class ConfirmarSosDialogComponent implements OnInit, OnDestroy {
  datos: { contactos: ContactoConfianza[]; mensaje: string } = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<ConfirmarSosDialogComponent> = inject(MatDialogRef);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  total: number = 5;
  segundos: number = 5;
  // NO VISTO EN CLASE: setInterval / ngOnDestroy (cuenta regresiva de 5 segundos)
  private temporizador: any;

  ngOnInit() {
    this.temporizador = setInterval(() => {
      this.segundos--;
      this.cdr.markForCheck();
      if (this.segundos <= 0) {
        this.enviar();
      }
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.temporizador);
  }

  enviar() {
    clearInterval(this.temporizador);
    this.dialogRef.close(true);
  }

  cancelar() {
    clearInterval(this.temporizador);
    this.dialogRef.close(false);
  }
}
