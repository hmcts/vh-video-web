import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenceGuard } from '../security/conference.guard';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';
import { pageUrls } from '../shared/page-url.constants';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';

const routes: Routes = [
    {
        path: `${pageUrls.ParticipantWaitingRoom}/:conferenceId`,
        component: ParticipantWaitingRoomComponent,
        canActivate: [ParticipantWaitingRoomGuard],
        data: { title: 'Waiting room' }
    },
    {
        path: `${pageUrls.JudgeWaitingRoom}/:conferenceId`,
        component: JudgeWaitingRoomComponent,
        canActivate: [ConferenceGuard],
        data: { title: 'Waiting room' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WaitingSpaceRoutingModule {}
