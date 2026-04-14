import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as L from 'leaflet';
import { AuditLog, Person } from '../../core/models';
import { PersonService } from '../../core/services/person.service';
import { FormattedLog, formatAuditLog } from '../../shared/audit-formatter.util';
import { initialsFor } from '../../shared/avatar-initials.util';

const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${iconBase}marker-icon-2x.png`,
  iconUrl: `${iconBase}marker-icon.png`,
  shadowUrl: `${iconBase}marker-shadow.png`,
});

@Component({
  selector: 'app-person-list',
  template: `
    <nz-card>
      <div class="section-head">
        <div>
          <h1 class="section-head__title">Pessoas</h1>
          <div class="section-head__subtitle">
            {{ persons.length }} {{ persons.length === 1 ? 'cadastrada' : 'cadastradas' }}
          </div>
        </div>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="router.navigate(['/persons/map'])">
            <span nz-icon nzType="environment"></span>
            Mapa completo
          </button>
          <button
            *nzSpaceItem
            nz-button
            nzType="primary"
            class="is-accent"
            (click)="router.navigate(['/persons/new'])"
          >
            <span nz-icon nzType="plus"></span>
            Nova Pessoa
          </button>
        </nz-space>
      </div>

      <nz-input-group [nzPrefix]="searchPrefix" class="search-input">
        <input
          nz-input
          placeholder="Buscar por nome, email ou cidade..."
          [(ngModel)]="query"
          (ngModelChange)="onSearch()"
        />
      </nz-input-group>
      <ng-template #searchPrefix>
        <span nz-icon nzType="search"></span>
      </ng-template>

      <nz-table #table [nzData]="persons" [nzLoading]="loading" nzSize="middle">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th style="width: 280px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of table.data">
            <td>
              <button
                class="name-with-avatar name-with-avatar--clickable"
                type="button"
                (click)="focusOnMap(p)"
                [disabled]="p.latitude === null || p.latitude === undefined"
                [title]="
                  p.latitude !== null && p.latitude !== undefined
                    ? 'Ver no mapa'
                    : 'Sem coordenadas'
                "
              >
                <span class="avatar">{{ initialsFor(p.name) }}</span>
                <span>{{ p.name }}</span>
                <span
                  *ngIf="p.latitude !== null && p.latitude !== undefined"
                  nz-icon
                  nzType="environment"
                  class="name-with-avatar__pin"
                ></span>
              </button>
            </td>
            <td>{{ p.email }}</td>
            <td>{{ p.phone }}</td>
            <td>
              {{ p.city }}<span *ngIf="p.state">/{{ p.state }}</span>
            </td>
            <td>
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" (click)="openHistory(p)">
                  <span nz-icon nzType="history"></span>
                  Histórico
                </button>
                <button
                  *nzSpaceItem
                  nz-button
                  nzSize="small"
                  (click)="router.navigate(['/persons', p.id])"
                >
                  <span nz-icon nzType="edit"></span>
                  Editar
                </button>
                <button
                  *nzSpaceItem
                  nz-button
                  nzSize="small"
                  nzDanger
                  nz-popconfirm
                  nzPopconfirmTitle="Excluir esta pessoa?"
                  (nzOnConfirm)="remove(p.id)"
                >
                  <span nz-icon nzType="delete"></span>
                </button>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>

    <nz-card
      *ngIf="personsWithCoords.length"
      class="mt-3"
      [nzTitle]="'Localização dos cadastros'"
      [nzExtra]="mapExtra"
    >
      <ng-template #mapExtra>
        <span class="text-muted">
          {{ personsWithCoords.length }} de {{ persons.length }} com coordenadas
        </span>
      </ng-template>
      <div #miniMap class="persons-map-preview"></div>
    </nz-card>

    <nz-drawer
      [nzVisible]="historyOpen"
      [nzTitle]="'Histórico — ' + (selected?.name ?? '')"
      [nzWidth]="520"
      (nzOnClose)="historyOpen = false"
    >
      <ng-container *nzDrawerContent>
        <nz-spin [nzSpinning]="historyLoading">
          <nz-empty
            *ngIf="!historyLoading && !formatted.length"
            nzNotFoundContent="Sem registros"
          ></nz-empty>
          <nz-timeline *ngIf="formatted.length">
            <nz-timeline-item *ngFor="let log of formatted" [nzColor]="log.color">
              <div class="mb-1">
                <nz-tag [nzColor]="log.color">{{ log.actionLabel }}</nz-tag>
                <span class="text-muted">{{ log.changedAt | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
              <div *ngIf="log.actor" class="audit-actor">
                <span nz-icon nzType="user"></span>
                <span>{{ log.actor.name }}</span>
                <span class="text-muted">· {{ log.actor.email }}</span>
              </div>
              <div *ngIf="log.summary" class="text-muted">{{ log.summary }}</div>
              <ul *ngIf="log.changes.length" style="padding-left: 18px; margin: 6px 0 0;">
                <li *ngFor="let c of log.changes">
                  <strong>{{ c.label }}:</strong>
                  <span *ngIf="c.before !== undefined">
                    <span class="text-muted">{{ c.before }}</span> →
                  </span>
                  {{ c.after }}
                </li>
              </ul>
            </nz-timeline-item>
          </nz-timeline>
        </nz-spin>
      </ng-container>
    </nz-drawer>
  `,
})
export class PersonListComponent implements OnInit, OnDestroy {
  @ViewChild('miniMap', { static: false }) miniMap?: ElementRef<HTMLDivElement>;

  persons: Person[] = [];
  loading = false;
  query = '';
  historyOpen = false;
  historyLoading = false;
  selected?: Person;
  formatted: FormattedLog[] = [];

  private searchDebounce?: ReturnType<typeof setTimeout>;
  private map?: L.Map;
  private markersByPerson = new Map<string, L.Marker>();

  constructor(
    private service: PersonService,
    public router: Router,
    private msg: NzMessageService,
  ) {}

  get personsWithCoords(): Person[] {
    return this.persons.filter((p) => p.latitude != null && p.longitude != null);
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  initialsFor = initialsFor;

  load(): void {
    this.loading = true;
    this.service.list(this.query || undefined).subscribe({
      next: (rows) => {
        this.persons = rows;
        setTimeout(() => this.renderMap(), 0);
      },
      error: () => this.msg.error('Falha ao carregar pessoas'),
      complete: () => (this.loading = false),
    });
  }

  private renderMap(): void {
    const container = this.miniMap?.nativeElement;
    if (!container) return;

    const withCoords = this.personsWithCoords;
    if (!withCoords.length) {
      this.map?.remove();
      this.map = undefined;
      return;
    }

    if (!this.map) {
      this.map = L.map(container, { zoomControl: true, attributionControl: false }).setView(
        [-25.45, -49.53],
        8,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(
        this.map,
      );
    }

    this.markersByPerson.forEach((m) => m.remove());
    this.markersByPerson.clear();
    for (const p of withCoords) {
      const marker = L.marker([p.latitude as number, p.longitude as number])
        .addTo(this.map as L.Map)
        .bindPopup(`<strong>${p.name}</strong><br/>${p.city}`);
      this.markersByPerson.set(p.id, marker);
    }

    const bounds = L.latLngBounds(
      withCoords.map((p) => [p.latitude as number, p.longitude as number]),
    );
    this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  focusOnMap(p: Person): void {
    if (p.latitude == null || p.longitude == null) return;
    const marker = this.markersByPerson.get(p.id);
    if (!this.map || !marker) return;

    // Rola até o mapa se estiver fora da viewport
    const container = this.miniMap?.nativeElement;
    container?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Anima zoom até o ponto e abre popup
    this.map.flyTo([p.latitude, p.longitude], 15, { duration: 0.9 });
    setTimeout(() => marker.openPopup(), 900);
  }

  onSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(), 300);
  }

  openHistory(p: Person): void {
    this.selected = p;
    this.historyOpen = true;
    this.historyLoading = true;
    this.formatted = [];
    this.service.history(p.id).subscribe({
      next: (logs: AuditLog[]) => {
        this.formatted = logs.map((l) => formatAuditLog(l));
      },
      error: () => this.msg.error('Falha ao carregar histórico'),
      complete: () => (this.historyLoading = false),
    });
  }

  remove(id: string): void {
    this.service.remove(id).subscribe({
      next: () => {
        this.msg.success('Pessoa excluída');
        this.load();
      },
      error: () => this.msg.error('Falha ao excluir'),
    });
  }
}
