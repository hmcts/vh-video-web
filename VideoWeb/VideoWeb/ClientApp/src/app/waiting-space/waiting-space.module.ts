import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AnalogueClockComponent } from './analogue-clock/analogue-clock.component';
import { ConsultationErrorComponent } from './consultation-modals/consultation-error/consultation-error.component';
import { IndividualParticipantStatusListComponent } from './individual-participant-status-list/individual-participant-status-list.component';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list/judge-participant-status-list.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantChatComponent } from './participant-chat/participant-chat.component';
import { ParticipantNetworkHealthComponent } from './participant-network-health/participant-network-health.component';
import { WaitingRoomMonitorComponent } from './participant-network-health/waiting-room-monitor.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { NotificationSoundsService } from './services/notification-sounds.service';
import { NotificationToastrService } from './services/notification-toastr.service';
import { RoomClosingToastrService } from './services/room-closing-toast.service';
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
import { PrivateConsultationRoomControlsComponent } from './private-consultation-room-controls/private-consultation-room-controls.component';
import { PrivateConsultationParticipantsComponent } from './participant-waiting-room/private-consultation-participants/private-consultation-participants.component';
import { InviteParticipantComponent } from './participant-waiting-room/invite-participant/invite-participant.component';
import { LoggedUserResolveService } from './services/logged-user-resolve.service';
import { ConsultationLeaveComponent } from './consultation-modals/consultation-leave/consultation-leave.component';
import { ParticipantNetworkPoorAlertComponent } from './participant-network-health/participant-network-poor-alert.component';
import { ChatPanelComponent } from './chat-panel/chat-panel.component';
import { ParticipantItemComponent } from './participant-waiting-room/private-consultation-participants/participant-item/participant-item.component';
import { SelfViewComponent } from './private-consultation-room-controls/self-view/self-view.component';
import { ConsultationInvitationsComponent } from './consultation-modals/consultation-invitations/consultation-invitations.component';

@NgModule({
    imports: [SharedModule, WaitingSpaceRoutingModule],
    declarations: [
        JudgeParticipantStatusListComponent,
        IndividualParticipantStatusListComponent,
        ParticipantWaitingRoomComponent,
        JudgeWaitingRoomComponent,
        AnalogueClockComponent,
        ParticipantChatComponent,
        ChatPanelComponent,
        ConsultationErrorComponent,
        ConsultationLeaveComponent,
        ParticipantNetworkHealthComponent,
        WaitingRoomMonitorComponent,
        PrivateConsultationRoomControlsComponent,
        ParticipantsPanelComponent,
        ParticipantAlertComponent,
        SelectHearingLayoutComponent,
        ConfirmCloseHearingPopupComponent,
        ConfirmStartHearingPopupComponent,
        HearingLayoutComponent,
        JudgeContextMenuComponent,
        JohWaitingRoomComponent,
        InviteParticipantComponent,
        PrivateConsultationParticipantsComponent,
        ParticipantNetworkPoorAlertComponent,
        ParticipantItemComponent,
        SelfViewComponent,
        ConsultationInvitationsComponent
    ],
    providers: [VideoCallService, NotificationSoundsService, NotificationToastrService, RoomClosingToastrService, LoggedUserResolveService]
})
export class WaitingSpaceModule {}
