import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AnalogueClockComponent } from './analogue-clock/analogue-clock.component';
import { AudioAlertComponent } from './audio-alert/audio-alert.component';
import { ConsultationErrorComponent } from './consultation-modals/consultation-error/consultation-error.component';
import { HearingControlsComponent } from './hearing-controls/hearing-controls.component';
import { IndividualParticipantStatusListComponent } from './individual-participant-status-list/individual-participant-status-list.component';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list/judge-participant-status-list.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantChatComponent } from './participant-chat/participant-chat.component';
import { ParticipantNetworkHealthComponent } from './participant-network-health/participant-network-health.component';
import { WaitingRoomMonitorComponent } from './participant-network-health/waiting-room-monitor.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { NotificationSoundsService } from './services/notification-sounds.service';
import { NotificationToastrService } from './services/notification-toastr.service';
import { VideoCallService } from './services/video-call.service';
import { WaitingSpaceRoutingModule } from './waiting-space-routing.module';
import { ParticipantsPanelComponent } from './participants-panel/participants-panel.component';
import { JudgeContextMenuComponent } from './judge-context-menu/judge-context-menu.component';
import { ParticipantAlertComponent } from './participant-alert/participant-alert.component';
import { SelectHearingLayoutComponent } from './select-hearing-layout/select-hearing-layout.component';
import { ConfirmCloseHearingPopupComponent } from './confirmation/confirm-close-hearing-popup.component';
import { HearingLayoutComponent } from './select-hearing-layout/hearing-layout.component';
import { ConfirmStartHearingPopupComponent } from './confirmation/confirm-start-hearing-popup.component';
import { JohWaitingRoomComponent } from './joh-waiting-room/joh-waiting-room.component';
import { LoggedUserResolveService } from './services/logged-user-resolve.service';

@NgModule({
    imports: [SharedModule, WaitingSpaceRoutingModule],
    declarations: [
        JudgeParticipantStatusListComponent,
        IndividualParticipantStatusListComponent,
        ParticipantWaitingRoomComponent,
        JudgeWaitingRoomComponent,
        AnalogueClockComponent,
        ParticipantChatComponent,
        AudioAlertComponent,
        ConsultationErrorComponent,
        ParticipantNetworkHealthComponent,
        WaitingRoomMonitorComponent,
        HearingControlsComponent,
        ParticipantsPanelComponent,
        ParticipantAlertComponent,
        SelectHearingLayoutComponent,
        ConfirmCloseHearingPopupComponent,
        ConfirmStartHearingPopupComponent,
        HearingLayoutComponent,
        JudgeContextMenuComponent,
        JohWaitingRoomComponent
    ],
    providers: [VideoCallService, NotificationSoundsService, LoggedUserResolveService]
})
export class WaitingSpaceModule {}
