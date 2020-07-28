import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenceGuard } from '../security/conference.guard';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';
import { pageUrls } from '../shared/page-url.constants';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { JudgeWaitingRoom2Component } from './judge-waiting-room-2/judge-waiting-room2.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';

const routes: Routes = [
    {
        path: `${pageUrls.ParticipantWaitingRoom}/:conferenceId`,
        component: ParticipantWaitingRoomComponent,
        canActivate: [ParticipantWaitingRoomGuard],
        data: { title: 'Waiting room' }
    },
    { path: `${pageUrls.JudgeWaitingRoom}/:conferenceId`, component: JudgeWaitingRoomComponent, data: { title: 'Waiting room' } },
    { path: `${pageUrls.JudgeWaitingRoom}2/:conferenceId`, component: JudgeWaitingRoom2Component, data: { title: 'Waiting room' } },
    {
        path: `${pageUrls.JudgeHearingRoom}/:conferenceId`,
        component: JudgeHearingPageComponent,
        canActivate: [ConferenceGuard],
        data: { title: 'Hearing room' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WaitingSpaceRoutingModule {}
