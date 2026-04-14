import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PublicActivityView, PublicService } from '../../core/services/public.service';
import { StageService } from '../../core/services/stage.service';
import { ReurbStage } from '../../core/models';

@Component({
  selector: 'app-public-consult',
  template: `
    <div class="public-shell">
      <div class="public-shell__inner">
        <div class="brand-chip mb-3">
          <span class="brand-chip__mark">C</span>
          <span>COGEP <span class="brand-chip__suffix">· Consulta pública</span></span>
        </div>

        <nz-card>
          <div class="auth-card__eyebrow">Acompanhar processo</div>
          <h1 class="auth-card__title">Consulta de regularização fundiária</h1>
          <p class="text-muted mb-3">
            Digite o número do protocolo (ex: REURB-2026-123456) para acompanhar o andamento do seu
            processo.
          </p>

          <form nz-form [formGroup]="form" (ngSubmit)="search()">
            <nz-form-item>
              <nz-form-control>
                <div class="d-flex gap-2">
                  <input nz-input formControlName="protocol" placeholder="REURB-AAAA-NNNNNN" />
                  <button
                    nz-button
                    nzType="primary"
                    [nzLoading]="loading"
                    [disabled]="form.invalid"
                  >
                    Consultar
                  </button>
                </div>
              </nz-form-control>
            </nz-form-item>
          </form>

          <nz-divider *ngIf="result || error"></nz-divider>

          <nz-empty *ngIf="error" [nzNotFoundContent]="error"></nz-empty>

          <div *ngIf="result" class="result-block">
            <div class="result-head">
              <div>
                <code class="result-protocol">{{ result.protocol }}</code>
                <h2 class="result-name">{{ result.name }}</h2>
              </div>
              <div class="result-progress">
                <div class="result-progress__value">
                  {{ progressPercent }}<span>%</span>
                </div>
                <div class="result-progress__label">concluído</div>
              </div>
            </div>

            <div class="result-meta">
              <div class="result-meta__item">
                <span nz-icon nzType="calendar"></span>
                <div>
                  <div class="result-meta__label">Início</div>
                  <div class="result-meta__value">{{ result.startDate | date: 'dd/MM/yyyy' }}</div>
                </div>
              </div>
              <div class="result-meta__item">
                <span nz-icon nzType="clock-circle"></span>
                <div>
                  <div class="result-meta__label">Previsão de término</div>
                  <div class="result-meta__value">{{ result.endDate | date: 'dd/MM/yyyy' }}</div>
                </div>
              </div>
              <div class="result-meta__item">
                <span nz-icon nzType="appstore"></span>
                <div>
                  <div class="result-meta__label">Etapa atual</div>
                  <div class="result-meta__value">{{ result.stage.order }} de {{ stages.length }}</div>
                </div>
              </div>
            </div>

            <nz-divider nzText="Andamento do processo"></nz-divider>

            <nz-steps [nzCurrent]="result.stage.order - 1" nzDirection="vertical" nzSize="small">
              <nz-step
                *ngFor="let s of stages"
                [nzTitle]="s.name"
                [nzDescription]="descriptionFor(s, result)"
              ></nz-step>
            </nz-steps>
          </div>
        </nz-card>
      </div>
    </div>
  `,
  styles: [
    `
      .public-shell__inner {
        margin: 0 auto;
        padding: 48px 20px;
        width: 100%;
        max-width: 720px;
      }
      .result-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .result-protocol {
        font-size: 12px;
      }
      .result-name {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.015em;
        margin: 8px 0 0;
        color: var(--c-ink);
      }
      .result-progress {
        text-align: right;
        flex-shrink: 0;
      }
      .result-progress__value {
        font-size: 30px;
        font-weight: 800;
        color: var(--c-accent);
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .result-progress__value span {
        font-size: 16px;
        margin-left: 2px;
      }
      .result-progress__label {
        font-size: 11px;
        color: var(--c-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-top: 4px;
      }
      .result-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        background: var(--c-surface-alt);
        border: 1px solid var(--c-border);
        border-radius: var(--radius-md);
        padding: 16px;
      }
      .result-meta__item {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .result-meta__item [nz-icon] {
        font-size: 18px;
        color: var(--c-accent);
        flex-shrink: 0;
      }
      .result-meta__label {
        font-size: 11px;
        color: var(--c-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .result-meta__value {
        font-size: 14px;
        font-weight: 600;
        color: var(--c-ink);
        margin-top: 2px;
      }
      @media (max-width: 600px) {
        .result-meta {
          grid-template-columns: 1fr;
        }
        .result-head {
          flex-direction: column;
        }
        .result-progress {
          text-align: left;
        }
      }
    `,
  ],
})
export class PublicConsultComponent implements OnInit {
  form: FormGroup;
  loading = false;
  result?: PublicActivityView;
  error?: string;
  stages: ReurbStage[] = [];

  get progressPercent(): number {
    if (!this.result || !this.stages.length) return 0;
    // Considera etapas concluídas (anteriores à atual) como progresso
    const completed = Math.max(0, this.result.stage.order - 1);
    return Math.round((completed / this.stages.length) * 100);
  }

  constructor(
    private fb: FormBuilder,
    private service: PublicService,
    private stageService: StageService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({ protocol: ['', [Validators.required]] });
  }

  ngOnInit(): void {
    this.stageService.list().subscribe((s) => (this.stages = s));
    const p = this.route.snapshot.paramMap.get('protocol');
    if (p) {
      this.form.patchValue({ protocol: p });
      this.search();
    }
  }

  search(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = undefined;
    this.result = undefined;
    this.service.consult(this.form.value.protocol).subscribe({
      next: (r) => (this.result = r),
      error: () => (this.error = 'Protocolo não encontrado'),
      complete: () => (this.loading = false),
    });
  }

  descriptionFor(stage: ReurbStage, result: PublicActivityView): string {
    if (stage.order < result.stage.order) return 'Concluída';
    if (stage.order === result.stage.order) return 'Em andamento';
    return 'Aguardando';
  }
}
