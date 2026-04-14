import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ActivityListComponent } from './activity-list.component';
import { ActivityFormComponent } from './activity-form.component';
import { ActivityKanbanComponent } from './activity-kanban.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: ActivityListComponent },
  { path: 'kanban', component: ActivityKanbanComponent },
  { path: 'new', component: ActivityFormComponent },
  { path: ':id', component: ActivityFormComponent },
];

@NgModule({
  declarations: [ActivityListComponent, ActivityFormComponent, ActivityKanbanComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ActivitiesModule {}
