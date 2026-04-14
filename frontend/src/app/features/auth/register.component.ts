import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-shell">
      <div class="auth-shell__inner">
        <div class="brand-chip mb-3">
          <span class="brand-chip__mark">C</span>
          <span>COGEP <span class="brand-chip__suffix">· Teste Técnico</span></span>
        </div>

        <div class="auth-card">
          <div class="auth-card__eyebrow">Primeiro acesso</div>
          <h1 class="auth-card__title">Criar conta</h1>

          <form nz-form [formGroup]="form" (ngSubmit)="submit()">
            <nz-form-item>
              <nz-form-label nzRequired>Nome</nz-form-label>
              <nz-form-control nzErrorTip="Mínimo 2 caracteres">
                <input nz-input formControlName="name" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Email</nz-form-label>
              <nz-form-control nzErrorTip="Email inválido">
                <input nz-input type="email" formControlName="email" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Senha</nz-form-label>
              <nz-form-control nzErrorTip="Mínimo 6 caracteres">
                <input nz-input type="password" formControlName="password" />
              </nz-form-control>
            </nz-form-item>
            <button
              nz-button
              nzType="primary"
              class="is-accent w-100"
              [nzLoading]="loading"
              [disabled]="form.invalid"
            >
              Cadastrar
            </button>
            <div class="text-center mt-3">Já tem conta? <a routerLink="/auth/login">Entrar</a></div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private msg: NzMessageService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.msg.success('Conta criada! Faça login.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.msg.error(err?.error?.error ?? 'Falha ao cadastrar');
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
