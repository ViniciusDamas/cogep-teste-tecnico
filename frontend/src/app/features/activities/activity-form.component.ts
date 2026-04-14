import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { ActivityService } from '../../core/services/activity.service';
import { PersonService } from '../../core/services/person.service';
import { StageService } from '../../core/services/stage.service';
import { Person, ReurbStage } from '../../core/models';

@Component({
  selector: 'app-activity-form',
  template: `
    <nz-card>
      <div class="section-head">
        <div>
          <h1 class="section-head__title">{{ id ? 'Editar atividade' : 'Nova atividade' }}</h1>
          <div class="section-head__subtitle">
            {{
              id
                ? 'Ajuste os dados da atividade REURB.'
                : 'Crie uma atividade REURB vinculada a uma pessoa cadastrada. Um protocolo é gerado automaticamente.'
            }}
          </div>
        </div>
      </div>

      <form nz-form [formGroup]="form" (ngSubmit)="submit()">
        <nz-form-item>
          <nz-form-label nzRequired>Nome</nz-form-label>
          <nz-form-control>
            <input
              nz-input
              formControlName="name"
              placeholder="Ex: Análise documental do lote 042"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label nzRequired>Descrição</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              rows="3"
              placeholder="Detalhes da atividade, observações internas, referências..."
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-section-divider">
          <span nz-icon nzType="user"></span>
          <span>Vínculo e etapa</span>
        </div>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Pessoa</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="personId"
                  nzShowSearch
                  nzPlaceHolder="Selecione a pessoa"
                >
                  <nz-option
                    *ngFor="let p of persons"
                    [nzValue]="p.id"
                    [nzLabel]="p.name"
                  ></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Etapa</nz-form-label>
              <nz-form-control [nzExtra]="'Em branco = primeira etapa (Requerimento)'">
                <nz-select
                  formControlName="stageId"
                  nzPlaceHolder="Primeira etapa (padrão)"
                  nzAllowClear
                >
                  <nz-option
                    *ngFor="let s of stages"
                    [nzValue]="s.id"
                    [nzLabel]="s.order + '. ' + s.name"
                  ></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div class="form-section-divider">
          <span nz-icon nzType="calendar"></span>
          <span>Prazo</span>
        </div>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Data de início</nz-form-label>
              <nz-form-control>
                <nz-date-picker
                  formControlName="startDate"
                  class="w-100"
                  nzFormat="dd/MM/yyyy"
                ></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Data de término</nz-form-label>
              <nz-form-control>
                <nz-date-picker
                  formControlName="endDate"
                  class="w-100"
                  nzFormat="dd/MM/yyyy"
                ></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div class="form-actions">
          <button nz-button type="button" (click)="router.navigate(['/activities'])">
            Cancelar
          </button>
          <button
            nz-button
            nzType="primary"
            class="is-accent"
            [nzLoading]="saving"
            [disabled]="form.invalid"
          >
            <span nz-icon nzType="check-circle"></span>
            {{ id ? 'Salvar alterações' : 'Criar atividade' }}
          </button>
        </div>
      </form>
    </nz-card>
  `,
})
export class ActivityFormComponent implements OnInit {
  form: FormGroup;
  id: string | null = null;
  saving = false;
  persons: Person[] = [];
  stages: ReurbStage[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ActivityService,
    private personService: PersonService,
    private stageService: StageService,
    private route: ActivatedRoute,
    public router: Router,
    private msg: NzMessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      personId: ['', [Validators.required]],
      stageId: [''],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    forkJoin({
      persons: this.personService.list(),
      stages: this.stageService.list(),
    }).subscribe({
      next: ({ persons, stages }) => {
        this.persons = persons;
        this.stages = stages;
        if (this.id) {
          this.service.get(this.id).subscribe({
            next: (a) =>
              this.form.patchValue({
                ...a,
                startDate: new Date(a.startDate),
                endDate: new Date(a.endDate),
              }),
            error: () => this.msg.error('Falha ao carregar atividade'),
          });
        }
      },
      error: () => this.msg.error('Falha ao carregar pessoas e etapas'),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const { startDate, endDate, ...rest } = this.form.value;
    const payload = {
      ...rest,
      startDate: this.toIso(startDate as Date),
      endDate: this.toIso(endDate as Date),
    };
    const op = this.id ? this.service.update(this.id, payload) : this.service.create(payload);
    op.subscribe({
      next: () => {
        this.msg.success(this.id ? 'Atualizada' : 'Criada');
        this.router.navigate(['/activities']);
      },
      error: (err) => {
        this.msg.error(err?.error?.error ?? 'Falha ao salvar');
        this.saving = false;
      },
    });
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
