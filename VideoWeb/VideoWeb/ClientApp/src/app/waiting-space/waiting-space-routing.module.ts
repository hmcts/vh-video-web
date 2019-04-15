import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';

const routes: Routes = [
  { path: 'participant/waiting-room/:conferenceId', component: ParticipantWaitingRoomComponent },
  { path: 'judge/waiting-room/:conferenceId', component: JudgeWaitingRoomComponent },
  { path: 'judge/hearing-room/:conferenceId', component: JudgeHearingPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WaitingSpaceRoutingModule { }
