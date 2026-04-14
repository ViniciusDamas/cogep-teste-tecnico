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

          <div *ngIf="result">
            <h3>{{ result.name }}</h3>
            <p>
              <code>{{ result.protocol }}</code>
            </p>
            <p class="text-muted">
              Início: {{ result.startDate | date: 'dd/MM/yyyy' }} — Previsão de término:
              {{ result.endDate | date: 'dd/MM/yyyy' }}
            </p>

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
    `,
  ],
})
export class PublicConsultComponent implements OnInit {
  form: FormGroup;
  loading = false;
  result?: PublicActivityView;
  error?: string;
  stages: ReurbStage[] = [];

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
