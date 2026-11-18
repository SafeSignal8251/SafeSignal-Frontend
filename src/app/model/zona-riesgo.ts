export class ZonaRiesgo {
  id_zona: number;
  nombre: string;
  nivel_riesgo: string;
  puntaje_riesgo: number;
  latitud: number;
  longitud: number;
  radio_metros: number;
  fecha_actualizacion: string;
  estado: boolean;
  umbral_alto_min: number;
  umbral_medio_min: number;
  umbral_medio_max: number;
  umbral_bajo_max: number;
  ventana_dias: number;
  radio_geocerca: number;
}
