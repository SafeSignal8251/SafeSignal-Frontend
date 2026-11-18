import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { PublicoHeaderComponent } from '../../compartido/publico-header-component/publico-header-component';

// HU-45: pantalla de Términos y Condiciones de la plataforma (pública, se puede leer sin iniciar sesión)
@Component({
  imports: [RouterLink, MatButton, PublicoHeaderComponent],
  selector: 'app-terminos-component',
  styleUrl: './terminos-component.css',
  templateUrl: './terminos-component.html',
})
export class TerminosComponent {
  actualizado: string = 'Noviembre 2026';

  secciones = [
    {
      titulo: '1. Aceptación de los términos',
      texto:
        'Al crear una cuenta en SafeSignal aceptas estos términos. Si no estás de acuerdo, no uses la plataforma. ' +
        'SafeSignal es una herramienta de apoyo para la seguridad ciudadana y no reemplaza a la Policía Nacional (105), al Serenazgo ni a los servicios de emergencia.',
    },
    {
      titulo: '2. Cuenta y seguridad de acceso',
      texto:
        'Debes registrar datos verdaderos (nombres, correo, DNI). Eres responsable de mantener la confidencialidad de tu contraseña. ' +
        'Tu contraseña se guarda cifrada y la sesión se protege con un token que vence automáticamente.',
    },
    {
      titulo: '3. Uso de tu ubicación',
      texto:
        'La ubicación se usa solo cuando activas una alerta SOS, un seguimiento o un reporte, y se comparte únicamente con tus contactos de confianza. ' +
        'Puedes dejar de compartirla en cualquier momento.',
    },
    {
      titulo: '4. Reportes de la comunidad',
      texto:
        'Los reportes deben ser verídicos. Los reportes falsos o denunciados como falsa alarma pueden ser descartados por un administrador ' +
        'y la cuenta puede ser suspendida si se repite el abuso.',
    },
    {
      titulo: '5. Privacidad y protección de datos',
      texto:
        'Tratamos tus datos personales conforme a la Ley N.º 29733 de Protección de Datos Personales. No vendemos tu información. ' +
        'Puedes editar tus datos o eliminar tu cuenta definitivamente desde "Mi Perfil"; al eliminarla se borran tus alertas, rutas, contactos y dispositivos.',
    },
    {
      titulo: '6. Dispositivos IoT',
      texto:
        'Los dispositivos vinculados (botón SOS, pulsera, sensores) dependen de su batería y conectividad. ' +
        'Revisa su estado con regularidad; SafeSignal no garantiza el envío de alertas si el dispositivo está apagado o sin señal.',
    },
    {
      titulo: '7. Limitación de responsabilidad',
      texto:
        'SafeSignal se ofrece "tal cual". No podemos garantizar la respuesta de terceros ni la disponibilidad ininterrumpida del servicio.',
    },
  ];
}
