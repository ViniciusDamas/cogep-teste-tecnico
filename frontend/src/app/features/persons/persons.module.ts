import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PersonListComponent } from './person-list.component';
import { PersonFormComponent } from './person-form.component';
import { PersonMapComponent } from './person-map.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: PersonListComponent },
  { path: 'map', component: PersonMapComponent },
  { path: 'new', component: PersonFormComponent },
  { path: ':id', component: PersonFormComponent },
];

@NgModule({
  declarations: [PersonListComponent, PersonFormComponent, PersonMapComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PersonsModule {}
