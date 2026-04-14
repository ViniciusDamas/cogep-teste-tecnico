import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PersonService } from '../../core/services/person.service';
import { ViaCepService } from '../../core/services/viacep.service';

@Component({
  selector: 'app-person-form',
  template: `
    <nz-card>
      <div class="section-head">
        <div>
          <h1 class="section-head__title">{{ id ? 'Editar pessoa' : 'Nova pessoa' }}</h1>
          <div class="section-head__subtitle">
            {{
              id
                ? 'Ajuste os dados do cadastro.'
                : 'Preencha os dados do beneficiário. O CEP preenche endereço automaticamente.'
            }}
          </div>
        </div>
      </div>

      <form nz-form [formGroup]="form" (ngSubmit)="submit()">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="16">
            <nz-form-item>
              <nz-form-label nzRequired>Nome</nz-form-label>
              <nz-form-control>
                <input
                  nz-input
                  formControlName="name"
                  placeholder="Nome completo do beneficiário"
                />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>Telefone</nz-form-label>
              <nz-form-control nzErrorTip="Formato: (DDD) 9XXXX-XXXX">
                <input
                  nz-input
                  formControlName="phone"
                  placeholder="(41) 99999-0000"
                  maxlength="15"
                  (input)="onPhoneInput($event)"
                />
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-form-item>
          <nz-form-label nzRequired>Email</nz-form-label>
          <nz-form-control nzErrorTip="Email inválido">
            <input
              nz-input
              type="email"
              formControlName="email"
              placeholder="beneficiario@exemplo.com"
            />
          </nz-form-control>
        </nz-form-item>

        <div class="form-section-divider">
          <span nz-icon nzType="environment"></span>
          <span>Endereço</span>
          <span class="form-section-divider__hint">preenche via ViaCEP ao sair do campo CEP</span>
        </div>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>CEP</nz-form-label>
              <nz-form-control [nzExtra]="'Digite 8 dígitos e saia do campo'">
                <input
                  nz-input
                  formControlName="zipCode"
                  placeholder="00000-000"
                  maxlength="9"
                  (blur)="lookupCep()"
                />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Rua</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="street" />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Número</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="number" placeholder="Ex: 380" />
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Complemento</nz-form-label>
              <nz-form-control>
                <input
                  nz-input
                  formControlName="complement"
                  placeholder="Apto, bloco, referência..."
                />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>Cidade</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="city" />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="4">
            <nz-form-item>
              <nz-form-label>UF</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="state" maxlength="2" />
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div class="form-actions">
          <button nz-button type="button" (click)="router.navigate(['/persons'])">Cancelar</button>
          <button
            nz-button
            nzType="primary"
            class="is-accent"
            [nzLoading]="saving"
            [disabled]="form.invalid"
          >
            <span nz-icon nzType="check-circle"></span>
            {{ id ? 'Salvar alterações' : 'Cadastrar pessoa' }}
          </button>
        </div>
      </form>
    </nz-card>
  `,
})
export class PersonFormComponent implements OnInit {
  form: FormGroup;
  id: string | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private service: PersonService,
    private viacep: ViaCepService,
    private route: ActivatedRoute,
    public router: Router,
    private msg: NzMessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) 9\d{4}-\d{4}$/)]],
      email: ['', [Validators.required, Validators.email]],
      zipCode: [''],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: [''],
      city: ['', [Validators.required]],
      state: [''],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.service.get(this.id).subscribe({
        next: (p) => this.form.patchValue(p),
        error: () => this.msg.error('Falha ao carregar pessoa'),
      });
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    if (digits.length === 0) formatted = '';
    else if (digits.length <= 2) formatted = `(${digits}`;
    else if (digits.length <= 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    this.form.get('phone')?.setValue(formatted, { emitEvent: false });
  }

  lookupCep(): void {
    const cep = this.form.get('zipCode')?.value as string;
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    this.viacep.lookup(cep).subscribe({
      next: (data) => {
        this.form.patchValue({
          street: data.street,
          city: data.city,
          state: data.state,
          complement: this.form.value.complement || data.complement,
        });
      },
      error: () => this.msg.warning('CEP não encontrado'),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const op = this.id
      ? this.service.update(this.id, this.form.value)
      : this.service.create(this.form.value);
    op.subscribe({
      next: () => {
        this.msg.success(this.id ? 'Atualizado' : 'Criado');
        this.router.navigate(['/persons']);
      },
      error: (err) => {
        this.msg.error(err?.error?.error ?? 'Falha ao salvar');
        this.saving = false;
      },
    });
  }
}
