import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-shell">
      <div class="auth-shell__inner">
        <div class="brand-chip mb-3">
          <span class="brand-chip__mark">C</span>
          <span>COGEP <span class="brand-chip__suffix">· Teste Técnico</span></span>
        </div>

        <div class="auth-card">
          <div class="auth-card__eyebrow">Acesso restrito</div>
          <h1 class="auth-card__title">Entrar</h1>

          <form nz-form [formGroup]="form" (ngSubmit)="submit()">
            <nz-form-item>
              <nz-form-label nzRequired>Email</nz-form-label>
              <nz-form-control nzErrorTip="Email inválido">
                <input nz-input type="email" formControlName="email" placeholder="seu@email.com" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Senha</nz-form-label>
              <nz-form-control nzErrorTip="Senha obrigatória">
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
              Entrar
            </button>
            <div class="text-center mt-3">
              <a routerLink="/auth/register">Criar conta</a>
            </div>
          </form>
        </div>

        <p class="auth-shell__note">
          Regularização Fundiária Urbana — <span>Lei 13.465/2017</span>
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-shell__inner {
        margin: auto;
        padding: 48px 20px;
        width: 100%;
        max-width: 420px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .auth-shell__note {
        margin-top: 24px;
        font-size: 12px;
        color: var(--c-muted);
        letter-spacing: 0.04em;
        span {
          font-weight: 600;
          color: var(--c-ink-soft);
        }
      }
      .text-center {
        text-align: center;
      }
    `,
  ],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private msg: NzMessageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.msg.error(err?.error?.error ?? 'Falha ao entrar');
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
