import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';

export const onTheDayRoutes: Routes = [
  { path: 'hearing-list', component: ParticipantHearingsComponent },
  { path: 'equipment-check/:conferenceId', component: ParticipantHearingsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(onTheDayRoutes)],
  exports: [RouterModule]
})
export class OnDaySetupRoutingModule { }
