import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { NZ_I18N, pt_BR } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import ptBr from '@angular/common/locales/pt';

import {
  HistoryOutline,
  EyeOutline,
  UserOutline,
  CalendarOutline,
  EnvironmentOutline,
  LogoutOutline,
  EditOutline,
  DeleteOutline,
  PlusOutline,
  SearchOutline,
  ArrowRightOutline,
  BellOutline,
  DashboardOutline,
  TeamOutline,
  FileTextOutline,
  AppstoreOutline,
  CloseOutline,
  CheckCircleOutline,
  ClockCircleOutline,
  InfoCircleOutline,
  MoreOutline,
  DownOutline,
  CopyOutline,
} from '@ant-design/icons-angular/icons';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { MainLayoutComponent } from './layout/main-layout.component';

const ICONS = [
  HistoryOutline,
  EyeOutline,
  UserOutline,
  CalendarOutline,
  EnvironmentOutline,
  LogoutOutline,
  EditOutline,
  DeleteOutline,
  PlusOutline,
  SearchOutline,
  ArrowRightOutline,
  BellOutline,
  DashboardOutline,
  TeamOutline,
  FileTextOutline,
  AppstoreOutline,
  CloseOutline,
  CheckCircleOutline,
  ClockCircleOutline,
  InfoCircleOutline,
  MoreOutline,
  DownOutline,
  CopyOutline,
];

registerLocaleData(ptBr);

@NgModule({
  declarations: [AppComponent, MainLayoutComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: pt_BR },
    { provide: NZ_ICONS, useValue: ICONS },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
