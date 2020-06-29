import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenceGuard } from '../security/conference.guard';
import { pageUrls } from '../shared/page-url.constants';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';
import { JudgeHearingPageErrorComponent } from './judge-hearing-page-error/judge-hearing-page-error.component';

const routes: Routes = [
    {
        path: `${pageUrls.ParticipantWaitingRoom}/:conferenceId`,
        component: ParticipantWaitingRoomComponent,
        canActivate: [ParticipantWaitingRoomGuard],
        data: { title: 'Waiting room' }
    },
    { path: `${pageUrls.JudgeWaitingRoom}/:conferenceId`, component: JudgeWaitingRoomComponent, data: { title: 'Waiting room' } },
    {
        path: `${pageUrls.JudgeHearingRoom}/:conferenceId`,
        component: JudgeHearingPageComponent,
        canActivate: [ConferenceGuard],
        data: { title: 'Hearing room' }
    },
    {
        path: `${pageUrls.JudgeHearingRoomError}`,
        component: JudgeHearingPageErrorComponent,
        data: { title: 'Error' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WaitingSpaceRoutingModule {}
