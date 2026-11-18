import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [RouterLink, MatButton, MatIcon],
  selector: 'app-inicio-component',
  styleUrl: './inicio-component.css',
  templateUrl: './inicio-component.html',
})
export class InicioComponent {
  funciones = [
    { icono: 'crisis_alert', color: 'rojo', titulo: 'Alertas SOS', texto: 'Activa una alerta de emergencia con un toque. Notifica a tus contactos y autoridades al instante.' },
    { icono: 'location_on', color: 'azul', titulo: 'Mapa en tiempo real', texto: 'Visualiza incidentes activos en tu zona y evita rutas peligrosas con alertas geolocalizadas.' },
    { icono: 'route', color: 'verde', titulo: 'Seguimiento de recorridos', texto: 'Comparte tu ruta en vivo con personas de confianza. Recibe una alerta si te desvías de la ruta.' },
    { icono: 'person_add', color: 'morado', titulo: 'Contactos de emergencia', texto: 'Registra hasta 5 contactos de confianza que serán notificados automáticamente en caso de SOS.' },
    { icono: 'trending_up', color: 'naranja', titulo: 'Estadísticas de tu zona', texto: 'Conoce los patrones de inseguridad en tu distrito y toma decisiones informadas sobre tus recorridos.' },
    { icono: 'sensors', color: 'celeste', titulo: 'Dispositivos IoT', texto: 'Conecta pulseras inteligentes, botones de pánico y sensores para una protección aún más completa.' },
  ];

  pasos = [
    { numero: 1, titulo: 'Crea tu cuenta', texto: 'Regístrate en menos de 2 minutos y configura tu perfil de seguridad con tus datos y zona habitual.' },
    { numero: 2, titulo: 'Agrega contactos', texto: 'Añade hasta 5 personas de confianza que recibirán alertas y tu ubicación cuando actives el SOS.' },
    { numero: 3, titulo: '¡Ya estás protegido!', texto: 'Recibe alertas en tiempo real, comparte tu recorrido y activa el SOS con un solo toque si lo necesitas.' },
  ];

  // Desplazamiento suave a una sección de la misma página
  irA(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
