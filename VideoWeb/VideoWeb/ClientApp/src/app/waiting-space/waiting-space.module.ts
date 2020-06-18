import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AnalogueClockComponent } from './analogue-clock/analogue-clock.component';
import { AudioAlertComponent } from './audio-alert/audio-alert.component';
import { ConsultationErrorComponent } from './consultation-modals/consultation-error/consultation-error.component';
import { NoConsultationRoomComponent } from './consultation-modals/no-consultation-room/no-consultation-room.component';
import { IndividualConsultationControlsComponent } from './individual-consultation-controls/individual-consultation-controls.component';
import { IndividualParticipantStatusListComponent } from './individual-participant-status-list/individual-participant-status-list.component';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list/judge-participant-status-list.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantChatComponent } from './participant-chat/participant-chat.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { NotificationSoundsService } from './services/notification-sounds.service';
import { VideoCallService } from './services/video-call.service';
import { WaitingSpaceRoutingModule } from './waiting-space-routing.module';

@NgModule({
    imports: [SharedModule, WaitingSpaceRoutingModule],
    declarations: [
        JudgeParticipantStatusListComponent,
        IndividualParticipantStatusListComponent,
        ParticipantWaitingRoomComponent,
        JudgeWaitingRoomComponent,
        JudgeHearingPageComponent,
        AnalogueClockComponent,
        IndividualConsultationControlsComponent,
        ParticipantChatComponent,
        AudioAlertComponent,
        NoConsultationRoomComponent,
        ConsultationErrorComponent
    ],
    providers: [VideoCallService, NotificationSoundsService]
})
export class WaitingSpaceModule {}
