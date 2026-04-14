import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserSummary } from '../core/models';
import { Observable } from 'rxjs';
import { initialsFor } from '../shared/avatar-initials.util';

@Component({
  selector: 'app-main-layout',
  template: `
    <nz-layout class="min-vh-100">
      <header class="app-header">
        <div class="app-header__inner">
          <a routerLink="/dashboard" class="brand-chip" aria-label="COGEP">
            <span class="brand-chip__mark">C</span>
            <span>
              COGEP
              <span class="brand-chip__suffix">· REURB</span>
            </span>
          </a>

          <ul nz-menu nzMode="horizontal" class="app-nav">
            <li nz-menu-item routerLink="/dashboard" routerLinkActive="ant-menu-item-selected">
              Dashboard
            </li>
            <li nz-menu-item routerLink="/persons" routerLinkActive="ant-menu-item-selected">
              Pessoas
            </li>
            <li nz-menu-item routerLink="/activities" routerLinkActive="ant-menu-item-selected">
              Atividades
            </li>
            <li
              nz-menu-item
              routerLink="/activities/kanban"
              routerLinkActive="ant-menu-item-selected"
            >
              Kanban
            </li>
          </ul>

          <div class="app-header__user" *ngIf="user$ | async as u">
            <button
              nz-button
              nz-dropdown
              [nzDropdownMenu]="userMenu"
              nzTrigger="click"
              nzPlacement="bottomRight"
              class="user-chip"
            >
              <span class="avatar avatar--sm">{{ initialsFor(u.name) }}</span>
              <span class="user-chip__name">{{ u.name }}</span>
              <span nz-icon nzType="down" class="user-chip__caret"></span>
            </button>
            <nz-dropdown-menu #userMenu="nzDropdownMenu">
              <ul nz-menu class="user-menu">
                <li nz-menu-item nzDisabled class="user-menu__header">
                  <div class="user-menu__name">{{ u.name }}</div>
                  <div class="user-menu__email">{{ u.email }}</div>
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item (click)="logout()">
                  <span nz-icon nzType="logout"></span>
                  Sair
                </li>
              </ul>
            </nz-dropdown-menu>
          </div>
        </div>
      </header>

      <nz-content class="page-container">
        <router-outlet></router-outlet>
      </nz-content>
    </nz-layout>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .app-header {
        background: var(--c-surface);
        border-bottom: 1px solid var(--c-border);
      }
      .app-header__inner {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 14px 32px;
      }
      .app-nav {
        flex-grow: 1;
        background: transparent !important;
      }
      .app-header__user {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 4px 12px 4px 4px !important;
        height: 40px !important;
        border-radius: 999px !important;
      }
      .user-chip__name {
        font-size: 13px;
        font-weight: 600;
        color: var(--c-ink);
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .user-chip__caret {
        font-size: 10px;
        color: var(--c-muted);
      }
    `,
  ],
})
export class MainLayoutComponent {
  user$: Observable<UserSummary | null>;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.user$ = this.auth.currentUser();
  }

  initialsFor = initialsFor;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
