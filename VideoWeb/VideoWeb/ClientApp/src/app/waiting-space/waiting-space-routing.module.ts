import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { PageUrls } from '../shared/page-url.constants';
import {ConferenceGuard} from '../security/conference.guard';

const routes: Routes = [
  { path: `${PageUrls.ParticipantWaitingRoom}/:conferenceId`, component: ParticipantWaitingRoomComponent, data: { title: 'Waiting room'} },
  { path: `${PageUrls.JudgeWaitingRoom}/:conferenceId`, component: JudgeWaitingRoomComponent, data: { title: 'Waiting room'} },
  { path: `${PageUrls.JudgeHearingRoom}/:conferenceId`, component: JudgeHearingPageComponent, canActivate: [ConferenceGuard], data: { title: 'Hearing room'} },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WaitingSpaceRoutingModule { }
