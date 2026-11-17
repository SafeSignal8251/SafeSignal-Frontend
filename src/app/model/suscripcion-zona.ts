export class SuscripcionZona {
  id_suscripcion: number;
  fecha_suscripcion: string;
  etiqueta: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  categorias: string;
  notificar_push: boolean;
  notificar_whatsapp_sms: boolean;
  notificar_correo: boolean;
  hora_desde: string;
  hora_hasta: string;
  id_usuario: number;
  id_zona: number;
}
