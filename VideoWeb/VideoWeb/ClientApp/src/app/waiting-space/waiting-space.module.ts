import { NgModule, isDevMode } from '@angular/core';
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
import { ContextMenuHeaderComponent } from './private-consultation-room-controls/context-menu-header/context-menu-header.component';
import { ConfirmLeaveHearingPopupComponent } from './confirmation/confirm-leave-hearing-popup.component';
import { ParticipantRemoteMuteStoreService } from './services/participant-remote-mute-store.service';
import { PrivateConsultationParticipantStatusComponent } from './participant-waiting-room/private-consultation-participants/private-consultation-participant-status/private-consultation-participant-status.component';
import { PrivateConsultationParticipantDisplayNameComponent } from './participant-waiting-room/private-consultation-participants/private-consultation-participant-display-name/private-consultation-participant-display-name.component';
import { FeedbackBannerComponent } from './waiting-room-shared/feedback-banner/feedback-banner.component';
import { ConfirmJoinHearingPopupComponent } from './confirmation/confirm-join-hearing-popup.component';
import { MuteMicrophoneComponent } from './mute-microphone/mute-microphone.component';
import { StartPrivateConsultationComponent } from './participant-waiting-room/start-private-consultation/start-private-consultation.component';
import { JoinPrivateConsultationComponent } from './participant-waiting-room/join-private-consultation/join-private-consultation.component';
import { PrivateConsultationLegalRepTermsOfServiceComponent } from './participant-waiting-room/private-consultation-legal-rep-terms-of-service/private-consultation-legal-rep-terms-of-service.component';
import { NgOptimizedImage } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { conferenceFeatureKey, conferenceReducer } from './store/reducers/conference.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ConferenceEffects } from './store/effects/conference.effects';
import { environment } from 'src/environments/environment';
import { ParticipantsPanelItemComponent } from './participants-panel/participants-panel-item/participants-panel-item.component';
import { WarnJoinHearingPopupComponent } from './confirmation/warn-join-hearing-popup.component';
import { ChangeHearingLayoutPopupComponent } from './change-hearing-layout-popup/change-hearing-layout.component';
import { VideoCallEffects } from './store/effects/video-call.effects';
import { AudioMixSelectionComponent } from './audio-mix-selection/audio-mix-selection.component';
import { ReferenceDataEffects } from './store/effects/reference-data.effects';
import { referenceDataFeatureKey, referenceDataReducer } from './store/reducers/reference-data.reducer';
import { NotificationEffects } from './store/effects/notification.effects';

@NgModule({
    imports: [
        SharedModule,
        WaitingSpaceRoutingModule,
        NgOptimizedImage,
        StoreModule.forFeature(conferenceFeatureKey, conferenceReducer),
        StoreModule.forFeature(referenceDataFeatureKey, referenceDataReducer),
        environment.production ? [] : StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: !isDevMode() }),
        EffectsModule.forFeature([ConferenceEffects, VideoCallEffects, ReferenceDataEffects, NotificationEffects])
    ],
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
        ConfirmLeaveHearingPopupComponent,
        ConfirmCloseHearingPopupComponent,
        ConfirmStartHearingPopupComponent,
        AudioMixSelectionComponent,
        HearingLayoutComponent,
        JudgeContextMenuComponent,
        JohWaitingRoomComponent,
        InviteParticipantComponent,
        PrivateConsultationParticipantsComponent,
        ParticipantNetworkPoorAlertComponent,
        ParticipantItemComponent,
        SelfViewComponent,
        ContextMenuHeaderComponent,
        PrivateConsultationParticipantStatusComponent,
        PrivateConsultationParticipantDisplayNameComponent,
        FeedbackBannerComponent,
        ConfirmJoinHearingPopupComponent,
        MuteMicrophoneComponent,
        StartPrivateConsultationComponent,
        JoinPrivateConsultationComponent,
        PrivateConsultationLegalRepTermsOfServiceComponent,
        ParticipantsPanelItemComponent,
        WarnJoinHearingPopupComponent,
        ChangeHearingLayoutPopupComponent
    ],
    providers: [
        VideoCallService,
        NotificationSoundsService,
        NotificationToastrService,
        RoomClosingToastrService,
        LoggedUserResolveService,
        ParticipantRemoteMuteStoreService
    ]
})
export class WaitingSpaceModule {}
