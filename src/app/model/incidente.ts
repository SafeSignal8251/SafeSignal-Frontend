export class Incidente {
  id_incidente: number;
  tipo_incidente: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  fecha_hora: string;
  nivel_riesgo: string;
  estado: string;
  direccion: string;
  distrito: string;
  id_zona: number;
  id_usuario: number;
  // El backend lo marca true cuando el reporte ya fue validado por la comunidad o verificado por el admin
  validado: boolean;
}
