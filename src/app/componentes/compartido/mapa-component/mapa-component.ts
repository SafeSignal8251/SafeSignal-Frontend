import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
// NO VISTO EN CLASE: Leaflet (librería de mapas con OpenStreetMap)
import * as L from 'leaflet';
import { LIMA } from '../../../core/utilidades';

export interface MarcadorMapa {
  lat: number;
  lng: number;
  color?: string;
  etiqueta?: string;
}
export interface CirculoMapa {
  lat: number;
  lng: number;
  radio: number; // metros
  color?: string;
  etiqueta?: string;
}

// Componente reutilizable (igual que ImageComponent del laboratorio de Material: se configura con @Input).
// NO VISTO EN CLASE: @Output, EventEmitter, ngOnChanges y ngOnDestroy.
@Component({
  selector: 'app-mapa-component',
  template: `<div #contenedor class="mapa" [style.height]="altura"></div>`,
  styleUrl: './mapa-component.css',
})
export class MapaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() centro: [number, number] = LIMA;
  @Input() zoom: number = 13;
  @Input() marcadores: MarcadorMapa[] = [];
  @Input() circulos: CirculoMapa[] = [];
  @Input() linea: [number, number][] = [];
  @Input() altura: string = '340px';
  @Input() seleccionable: boolean = false; // si es true, al hacer clic en el mapa se emite el punto
  @Output() puntoElegido = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('contenedor') contenedor: ElementRef<HTMLDivElement>;
  private mapa?: L.Map;
  private capa?: L.LayerGroup;

  ngAfterViewInit() {
    this.mapa = L.map(this.contenedor.nativeElement, { zoomControl: true }).setView(this.centro, this.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.mapa);
    this.capa = L.layerGroup().addTo(this.mapa);
    if (this.seleccionable) {
      this.mapa.on('click', (e: L.LeafletMouseEvent) => {
        this.puntoElegido.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }
    this.dibujar();
    // Si el mapa estaba en un contenedor oculto, se recalcula el tamaño
    setTimeout(() => this.mapa?.invalidateSize(), 300);
  }

  ngOnChanges(cambios: SimpleChanges) {
    if (!this.mapa) {
      return;
    }
    if (cambios['centro'] || cambios['zoom']) {
      this.mapa.setView(this.centro, this.zoom);
    }
    this.dibujar();
  }

  ngOnDestroy() {
    this.mapa?.remove();
  }

  private dibujar() {
    if (!this.capa) {
      return;
    }
    this.capa.clearLayers();
    for (const c of this.circulos) {
      const color = c.color ?? '#2e75b6';
      const circulo = L.circle([c.lat, c.lng], { radius: c.radio, color, weight: 1, fillColor: color, fillOpacity: 0.22 });
      if (c.etiqueta) {
        circulo.bindTooltip(c.etiqueta);
      }
      circulo.addTo(this.capa);
    }
    if (this.linea.length > 1) {
      L.polyline(this.linea, { color: '#2e75b6', weight: 5, opacity: 0.85 }).addTo(this.capa);
    }
    for (const m of this.marcadores) {
      const punto = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: m.color ?? '#c0392b',
        fillOpacity: 1,
      });
      if (m.etiqueta) {
        punto.bindTooltip(m.etiqueta);
      }
      punto.addTo(this.capa);
    }
  }
}
