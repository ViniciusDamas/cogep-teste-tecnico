import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PublicConsultComponent } from './public-consult.component';

const routes: Routes = [
  { path: '', component: PublicConsultComponent },
  { path: ':protocol', component: PublicConsultComponent },
];

@NgModule({
  declarations: [PublicConsultComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PublicModule {}
