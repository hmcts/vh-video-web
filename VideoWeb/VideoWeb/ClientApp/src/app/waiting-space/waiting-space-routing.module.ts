import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';

const routes: Routes = [
  { path: 'waiting-room/:conferenceId', component: ParticipantWaitingRoomComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WaitingSpaceRoutingModule { }
