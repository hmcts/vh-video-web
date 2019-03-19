import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { AuthGuard } from '../security/auth.gaurd';

export const onTheDayRoutes: Routes = [
  { path: 'hearing-list', component: ParticipantHearingsComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(onTheDayRoutes)],
  exports: [RouterModule]
})
export class OnDaySetupRoutingModule { }
