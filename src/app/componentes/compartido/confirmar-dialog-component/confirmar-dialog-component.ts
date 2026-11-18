import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
// NO VISTO EN CLASE: MatDialog, MAT_DIALOG_DATA y MatDialogRef
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

// Datos que recibe el diálogo. Sirve para todas las confirmaciones del proyecto:
// eliminar contacto, eliminar cuenta, cancelar alerta, suspender / reactivar cuenta,
// descartar reporte y enviar aviso masivo.
export interface ConfirmarDatos {
  titulo: string;
  mensaje: string;
  icono?: string;
  detalle?: string; // recuadro destacado (ej. el nombre del contacto)
  advertencia?: string; // texto en recuadro amarillo
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean; // botón rojo
  tituloOpciones?: string;
  opciones?: string[]; // lista de motivos (se elige uno)
  pedirTexto?: boolean; // muestra una caja de texto
  etiquetaTexto?: string;
  textoObligatorio?: boolean;
}

export interface ConfirmarResultado {
  motivo: string;
  texto: string;
}

@Component({
  imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatIcon],
  selector: 'app-confirmar-dialog-component',
  styleUrl: './confirmar-dialog-component.css',
  templateUrl: './confirmar-dialog-component.html',
})
export class ConfirmarDialogComponent {
  datos: ConfirmarDatos = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<ConfirmarDialogComponent> = inject(MatDialogRef);

  motivo: string = this.datos.opciones && this.datos.opciones.length > 0 ? this.datos.opciones[0] : '';
  texto: string = '';
  intento: boolean = false;

  confirmar() {
    this.intento = true;
    if (this.datos.pedirTexto && this.datos.textoObligatorio && this.texto.trim() === '') {
      return;
    }
    const resultado: ConfirmarResultado = { motivo: this.motivo, texto: this.texto.trim() };
    this.dialogRef.close(resultado);
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
