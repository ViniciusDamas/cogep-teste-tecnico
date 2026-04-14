import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { Activity, ReurbStage } from '../../core/models';
import { ActivityService } from '../../core/services/activity.service';
import { StageService } from '../../core/services/stage.service';

interface Column {
  stage: ReurbStage;
  items: Activity[];
}

@Component({
  selector: 'app-activity-kanban',
  template: `
    <div class="kanban-shell">
      <div class="kanban-shell__head">
        <div>
          <h1 class="kanban-shell__title">Kanban — etapas REURB</h1>
          <div class="kanban-shell__subtitle">
            Arraste os cards para mudar de etapa. Cada mudança gera audit log e dispara notificação.
          </div>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading">
        <div #board class="kanban-board" cdkScrollable>
          <div
            *ngFor="let col of columns; trackBy: trackByStage"
            class="kanban-column"
            cdkDropList
            [cdkDropListData]="col.items"
            [cdkDropListConnectedTo]="dropListIds"
            [id]="col.stage.id"
            (cdkDropListDropped)="drop($event)"
          >
            <div class="kanban-column__header">
              <span>{{ col.stage.order }}. {{ col.stage.name }}</span>
              <nz-tag nzColor="blue">{{ col.items.length }}</nz-tag>
            </div>

            <div
              *ngFor="let a of col.items"
              cdkDrag
              class="kanban-card"
              (cdkDragMoved)="onDragMoved($event)"
              (cdkDragEnded)="stopAutoScroll()"
            >
              <button
                class="kanban-card__menu"
                type="button"
                nz-button
                nzSize="small"
                nz-dropdown
                [nzDropdownMenu]="cardMenu"
                nzTrigger="click"
                nzPlacement="bottomRight"
                (click)="$event.stopPropagation()"
              >
                <span nz-icon nzType="more"></span>
              </button>
              <nz-dropdown-menu #cardMenu="nzDropdownMenu">
                <ul nz-menu>
                  <li nz-menu-item nzDisabled class="user-menu__header">
                    <div class="user-menu__name">Mover para etapa</div>
                    <div class="user-menu__email">{{ a.protocol }}</div>
                  </li>
                  <li nz-menu-divider></li>
                  <li
                    nz-menu-item
                    *ngFor="let s of stages"
                    [nzDisabled]="s.id === a.stageId"
                    (click)="moveToStage(a, s)"
                  >
                    <span
                      nz-icon
                      [nzType]="s.id === a.stageId ? 'check-circle' : 'arrow-right'"
                    ></span>
                    {{ s.order }}. {{ s.name }}
                  </li>
                </ul>
              </nz-dropdown-menu>

              <strong>{{ a.name }}</strong>
              <div class="text-muted" style="font-size: 12px;">
                <code>{{ a.protocol }}</code>
              </div>
              <div style="font-size: 13px; margin-top: 6px;">{{ a.person?.name }}</div>
              <div class="text-muted" style="font-size: 11px; margin-top: 6px;">
                {{ a.startDate | date: 'dd/MM' }} → {{ a.endDate | date: 'dd/MM' }}
              </div>
            </div>

            <div *ngIf="col.items.length === 0" class="kanban-column__empty">
              Arraste cards para cá
            </div>
          </div>
        </div>
      </nz-spin>
    </div>
  `,
})
export class ActivityKanbanComponent implements OnInit {
  @ViewChild('board', { static: false }) board!: ElementRef<HTMLDivElement>;
  columns: Column[] = [];
  stages: ReurbStage[] = [];
  dropListIds: string[] = [];
  loading = false;

  private autoScrollTimer?: ReturnType<typeof setInterval>;
  private autoScrollSpeed = 0;

  constructor(
    private activityService: ActivityService,
    private stageService: StageService,
    private msg: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      stages: this.stageService.list(),
      activities: this.activityService.list(),
    }).subscribe({
      next: ({ stages, activities }) => {
        this.stages = stages;
        this.columns = stages.map((s) => ({
          stage: s,
          items: activities.filter((a) => a.stageId === s.id),
        }));
        this.dropListIds = stages.map((s) => s.id);
      },
      error: () => this.msg.error('Falha ao carregar'),
      complete: () => (this.loading = false),
    });
  }

  trackByStage(_i: number, col: Column): string {
    return col.stage.id;
  }

  onDragMoved(event: CdkDragMove): void {
    const board = this.board?.nativeElement;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const threshold = 260;
    const maxSpeed = 120;
    const minSpeed = 18;
    const x = event.pointerPosition.x;

    // Velocidade proporcional à proximidade da borda (mais perto = mais rápido)
    let speed = 0;
    if (x > rect.right - threshold) {
      const dist = Math.max(0, rect.right - x);
      speed = Math.round(minSpeed + (maxSpeed - minSpeed) * (1 - dist / threshold));
    } else if (x < rect.left + threshold) {
      const dist = Math.max(0, x - rect.left);
      speed = -Math.round(minSpeed + (maxSpeed - minSpeed) * (1 - dist / threshold));
    }

    this.autoScrollSpeed = speed;
    if (speed === 0) {
      this.stopAutoScroll();
      return;
    }
    if (!this.autoScrollTimer) {
      this.autoScrollTimer = setInterval(() => {
        board.scrollLeft += this.autoScrollSpeed;
      }, 8);
    }
  }

  stopAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = undefined;
    }
  }

  moveToStage(activity: Activity, stage: ReurbStage): void {
    if (activity.stageId === stage.id) return;
    const fromCol = this.columns.find((c) => c.stage.id === activity.stageId);
    const toCol = this.columns.find((c) => c.stage.id === stage.id);
    if (fromCol) fromCol.items = fromCol.items.filter((x) => x.id !== activity.id);
    if (toCol) toCol.items = [{ ...activity, stageId: stage.id }, ...toCol.items];

    this.activityService.moveStage(activity.id, stage.id).subscribe({
      next: () => this.msg.success(`Movido para ${stage.order}. ${stage.name}`),
      error: () => {
        this.msg.error('Falha ao mover — recarregando');
        this.load();
      },
    });
  }

  drop(event: CdkDragDrop<Activity[]>): void {
    this.stopAutoScroll();
    if (event.previousContainer === event.container) return;
    const activity = event.previousContainer.data[event.previousIndex];
    const newStageId = event.container.id;

    event.previousContainer.data.splice(event.previousIndex, 1);
    event.container.data.splice(event.currentIndex, 0, { ...activity, stageId: newStageId });

    this.activityService.moveStage(activity.id, newStageId).subscribe({
      next: () => this.msg.success(`Movido para nova etapa`),
      error: () => {
        this.msg.error('Falha ao mover — recarregando');
        this.load();
      },
    });
  }
}
