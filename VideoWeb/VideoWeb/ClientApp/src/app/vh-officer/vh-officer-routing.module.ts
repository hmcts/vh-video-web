import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VhoHearingsComponent } from './hearings/vho-hearings.component';
import { AdminGuard } from '../security/admin.guard';

const routes: Routes = [
  { path: '', component: VhoHearingsComponent, canActivate: [AdminGuard], data: { title: 'VHO Admin dashboard'} },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VhOfficerRoutingModule { }
