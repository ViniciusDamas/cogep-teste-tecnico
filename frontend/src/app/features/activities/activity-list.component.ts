import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { Activity, AuditLog, Person, ReurbStage } from '../../core/models';
import { ActivityService } from '../../core/services/activity.service';
import { PersonService } from '../../core/services/person.service';
import { StageService } from '../../core/services/stage.service';
import { FormattedLog, formatAuditLog } from '../../shared/audit-formatter.util';
import { initialsFor } from '../../shared/avatar-initials.util';

interface MiniColumn {
  stage: ReurbStage;
  items: Activity[];
}

interface StatusInfo {
  label: string;
  color: 'default' | 'blue' | 'green' | 'red' | 'gold';
  className: string;
}

@Component({
  selector: 'app-activity-list',
  template: `
    <nz-card>
      <div class="section-head">
        <div>
          <h1 class="section-head__title">Atividades</h1>
          <div class="section-head__subtitle">
            {{ activities.length }} {{ activities.length === 1 ? 'ativa' : 'ativas' }}
            <span *ngIf="overdueCount > 0">
              ·
              <span style="color: var(--c-danger); font-weight: 600;"
                >{{ overdueCount }} em atraso</span
              ></span
            >
            <span *ngIf="dueSoonCount > 0">
              ·
              <span style="color: var(--c-warn); font-weight: 600;"
                >{{ dueSoonCount }} vencendo</span
              ></span
            >
            · em {{ populatedStages }} de {{ stages.length }} etapas
          </div>
        </div>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="router.navigate(['/activities/kanban'])">
            <span nz-icon nzType="appstore"></span>
            Ver Kanban
          </button>
          <button
            *nzSpaceItem
            nz-button
            nzType="primary"
            class="is-accent"
            (click)="router.navigate(['/activities/new'])"
          >
            <span nz-icon nzType="plus"></span>
            Nova Atividade
          </button>
        </nz-space>
      </div>

      <div class="filters-row">
        <nz-input-group [nzPrefix]="searchPrefix" class="filters-row__search">
          <input
            nz-input
            placeholder="Buscar por protocolo, atividade ou pessoa..."
            [(ngModel)]="query"
            (ngModelChange)="applyFilters()"
          />
        </nz-input-group>
        <ng-template #searchPrefix>
          <span nz-icon nzType="search"></span>
        </ng-template>

        <nz-select
          class="filters-row__select"
          [(ngModel)]="stageFilter"
          (ngModelChange)="applyFilters()"
          nzPlaceHolder="Todas as etapas"
          nzAllowClear
        >
          <nz-option
            *ngFor="let s of stages"
            [nzValue]="s.id"
            [nzLabel]="s.order + '. ' + s.name"
          ></nz-option>
        </nz-select>
      </div>

      <nz-table #table [nzData]="filtered" [nzLoading]="loading" nzSize="middle">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Nome</th>
            <th>Pessoa</th>
            <th>Etapa</th>
            <th>Término</th>
            <th>Status</th>
            <th style="width: 240px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of table.data">
            <td>
              <a
                class="protocol-link"
                [href]="'/consulta/' + a.protocol"
                target="_blank"
                rel="noopener"
              >
                <code>{{ a.protocol }}</code>
              </a>
            </td>
            <td>{{ a.name }}</td>
            <td>
              <div class="name-with-avatar">
                <span class="avatar avatar--sm">{{ initialsFor(a.person?.name ?? '?') }}</span>
                <span>{{ a.person?.name }}</span>
              </div>
            </td>
            <td>
              <nz-tag nzColor="blue">{{ a.stage?.name }}</nz-tag>
            </td>
            <td>{{ a.endDate | date: 'dd/MM/yyyy' }}</td>
            <td>
              <span class="status-badge" [ngClass]="statusFor(a).className">
                <span class="status-badge__dot"></span>
                {{ statusFor(a).label }}
              </span>
            </td>
            <td>
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" (click)="openHistory(a)">
                  <span nz-icon nzType="history"></span>
                  Histórico
                </button>
                <button
                  *nzSpaceItem
                  nz-button
                  nzSize="small"
                  (click)="router.navigate(['/activities', a.id])"
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
                  nzPopconfirmTitle="Excluir?"
                  (nzOnConfirm)="remove(a.id)"
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
      *ngIf="activities.length"
      class="mt-3"
      [nzTitle]="'Visão geral por etapa'"
      [nzExtra]="miniExtra"
    >
      <ng-template #miniExtra>
        <a
          class="text-muted"
          (click)="router.navigate(['/activities/kanban'])"
          style="cursor: pointer;"
        >
          Abrir kanban completo →
        </a>
      </ng-template>
      <div class="mini-kanban">
        <div
          *ngFor="let col of miniColumns"
          class="mini-kanban__column"
          [class.mini-kanban__column--empty]="col.items.length === 0"
        >
          <div class="mini-kanban__column-head">
            <span class="mini-kanban__order">{{ col.stage.order }}</span>
            <span class="mini-kanban__name">{{ col.stage.name }}</span>
            <span class="mini-kanban__count">{{ col.items.length }}</span>
          </div>
          <div
            *ngFor="let a of col.items.slice(0, 3)"
            class="mini-kanban__card"
            (click)="router.navigate(['/activities', a.id])"
          >
            <div class="mini-kanban__card-name">{{ a.name }}</div>
            <div class="mini-kanban__card-meta">
              <code>{{ a.protocol }}</code>
            </div>
          </div>
          <div *ngIf="col.items.length > 3" class="mini-kanban__more">
            +{{ col.items.length - 3 }} mais
          </div>
          <div *ngIf="col.items.length === 0" class="mini-kanban__empty">Vazio</div>
        </div>
      </div>
    </nz-card>

    <nz-drawer
      [nzVisible]="historyOpen"
      [nzTitle]="'Histórico — ' + (selected?.protocol ?? '')"
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
export class ActivityListComponent implements OnInit {
  activities: Activity[] = [];
  filtered: Activity[] = [];
  stages: ReurbStage[] = [];
  persons: Person[] = [];
  miniColumns: MiniColumn[] = [];

  query = '';
  stageFilter: string | null = null;

  loading = false;
  historyOpen = false;
  historyLoading = false;
  selected?: Activity;
  formatted: FormattedLog[] = [];

  overdueCount = 0;
  dueSoonCount = 0;
  populatedStages = 0;

  constructor(
    private service: ActivityService,
    private stageService: StageService,
    private personService: PersonService,
    public router: Router,
    private msg: NzMessageService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      stages: this.stageService.list(),
      persons: this.personService.list(),
    }).subscribe(({ stages, persons }) => {
      this.stages = stages;
      this.persons = persons;
      this.rebuildMiniColumns();
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: (rows) => {
        this.activities = rows;
        this.computeCounts();
        this.rebuildMiniColumns();
        this.applyFilters();
      },
      error: () => this.msg.error('Falha ao carregar'),
      complete: () => (this.loading = false),
    });
  }

  initialsFor = initialsFor;

  statusFor(a: Activity): StatusInfo {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(a.endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((end.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0)
      return { label: 'Em atraso', color: 'red', className: 'status-badge--overdue' };
    if (diffDays <= 7)
      return { label: 'Vencendo', color: 'gold', className: 'status-badge--duesoon' };
    return { label: 'No prazo', color: 'green', className: 'status-badge--ontrack' };
  }

  applyFilters(): void {
    const q = this.query.trim().toLowerCase();
    this.filtered = this.activities.filter((a) => {
      const matchesQ =
        !q ||
        a.protocol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.person?.name?.toLowerCase().includes(q) ?? false);
      const matchesStage = !this.stageFilter || a.stageId === this.stageFilter;
      return matchesQ && matchesStage;
    });
  }

  private computeCounts(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let overdue = 0;
    let soon = 0;
    for (const a of this.activities) {
      const end = new Date(a.endDate);
      end.setHours(0, 0, 0, 0);
      const diff = Math.floor((end.getTime() - today.getTime()) / 86400000);
      if (diff < 0) overdue++;
      else if (diff <= 7) soon++;
    }
    this.overdueCount = overdue;
    this.dueSoonCount = soon;
  }

  private rebuildMiniColumns(): void {
    if (!this.stages.length) return;
    this.miniColumns = this.stages.map((s) => ({
      stage: s,
      items: this.activities.filter((a) => a.stageId === s.id),
    }));
    this.populatedStages = this.miniColumns.filter((c) => c.items.length > 0).length;
  }

  openHistory(a: Activity): void {
    this.selected = a;
    this.historyOpen = true;
    this.historyLoading = true;
    this.formatted = [];
    this.service.history(a.id).subscribe({
      next: (logs: AuditLog[]) => {
        this.formatted = logs.map((l) =>
          formatAuditLog(l, { stages: this.stages, persons: this.persons }),
        );
      },
      error: () => this.msg.error('Falha ao carregar histórico'),
      complete: () => (this.historyLoading = false),
    });
  }

  remove(id: string): void {
    this.service.remove(id).subscribe({
      next: () => {
        this.msg.success('Excluído');
        this.load();
      },
      error: () => this.msg.error('Falha ao excluir'),
    });
  }
}
