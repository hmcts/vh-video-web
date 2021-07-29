import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConferenceGuard } from '../security/conference.guard';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';
import { BackLinkDetails } from '../shared/models/back-link-details';
import { pageUrls } from '../shared/page-url.constants';
import { JohWaitingRoomComponent } from './joh-waiting-room/joh-waiting-room.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { LoggedUserResolveService } from './services/logged-user-resolve.service';

const returnText = 'judge-waiting-room.return-to-video-hearing-list';
const routes: Routes = [
    {
        path: `${pageUrls.ParticipantWaitingRoom}/:conferenceId`,
        component: ParticipantWaitingRoomComponent,
        canActivate: [ParticipantWaitingRoomGuard],
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room', backLink: new BackLinkDetails(returnText, pageUrls.ParticipantHearingList) }
    },
    {
        path: `${pageUrls.JudgeWaitingRoom}/:conferenceId`,
        component: JudgeWaitingRoomComponent,
        canActivate: [ConferenceGuard],
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room', backLink: new BackLinkDetails(returnText, pageUrls.JudgeHearingList) }
    },
    {
        path: `${pageUrls.JOHWaitingRoom}/:conferenceId`,
        component: JohWaitingRoomComponent,
        resolve: { loggedUser: LoggedUserResolveService },
        data: { title: 'Waiting room', backLink: new BackLinkDetails(returnText, pageUrls.JudgeHearingList) }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WaitingSpaceRoutingModule {}
