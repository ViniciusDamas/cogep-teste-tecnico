import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { PersonService } from '../../core/services/person.service';
import { Person } from '../../core/models';

const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${iconBase}marker-icon-2x.png`,
  iconUrl: `${iconBase}marker-icon.png`,
  shadowUrl: `${iconBase}marker-shadow.png`,
});

@Component({
  selector: 'app-person-map',
  template: `
    <div class="map-shell">
      <div class="map-shell__head">
        <div>
          <h1 class="map-shell__title">Mapa de pessoas cadastradas</h1>
          <div class="map-shell__subtitle">
            Geocoding via ViaCEP + Nominatim (OpenStreetMap) · {{ withCoords }} de {{ total }} com
            coordenadas
          </div>
        </div>
      </div>
      <div #mapRef class="map-shell__canvas"></div>
    </div>
  `,
})
export class PersonMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapRef', { static: false }) mapRef!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private persons: Person[] = [];
  total = 0;
  withCoords = 0;

  constructor(private service: PersonService) {}

  ngOnInit(): void {
    this.service.list().subscribe((rows) => {
      this.persons = rows;
      this.total = rows.length;
      this.withCoords = rows.filter((p) => p.latitude != null && p.longitude != null).length;
      this.renderPins();
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapRef.nativeElement).setView([-25.45, -49.53], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.renderPins();
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderPins(): void {
    if (!this.map) return;
    const withCoords = this.persons.filter((p) => p.latitude != null && p.longitude != null);
    for (const p of withCoords) {
      L.marker([p.latitude as number, p.longitude as number])
        .addTo(this.map)
        .bindPopup(`<strong>${p.name}</strong><br/>${p.email}<br/>${p.phone}`);
    }
    if (withCoords.length) {
      const bounds = L.latLngBounds(
        withCoords.map((p) => [p.latitude as number, p.longitude as number]),
      );
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  }
}
