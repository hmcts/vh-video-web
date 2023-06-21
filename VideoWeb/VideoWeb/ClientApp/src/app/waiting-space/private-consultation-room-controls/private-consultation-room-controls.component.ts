import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { first, takeUntil } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/api/config.service';
import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceService } from 'src/app/services/conference/conference.service';
import { ConferenceStatusChanged } from 'src/app/services/conference/models/conference-status-changed.model';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { VideoCallService } from '../services/video-call.service';
import { VideoControlService } from '../../services/conference/video-control.service';
import { VideoControlCacheService } from '../../services/conference/video-control-cache.service';
@Component({
    selector: 'app-private-consultation-room-controls',
    templateUrl: './private-consultation-room-controls.component.html',
    styleUrls: ['./private-consultation-room-controls.component.scss'],
    inputs: [
        'conferenceId',
        'participant',
        'isPrivateConsultation',
        'outgoingStream',
        'isSupportedBrowserForNetworkHealth',
        'showConsultationControls',
        'unreadMessageCount'
    ],
    outputs: ['leaveConsultation', 'lockConsultation', 'togglePanel', 'changeDeviceToggle', 'leaveHearing']
})
export class PrivateConsultationRoomControlsComponent extends HearingControlsBaseComponent {
    @Input() public canToggleParticipantsPanel: boolean;
    @Input() public isChatVisible: boolean;
    @Input() public areParticipantsVisible: boolean;
    @Input() public wowzaUUID: string;

    showContextMenu = false;
    enableDynamicEvidenceSharing = false;
    isStaffMemberFeatureEnabled = false;

    private conferenceStatus: ConferenceStatusChanged;

    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected participantService: ParticipantService,
        protected translateService: TranslateService,
        protected videoControlService: VideoControlService,
        protected userMediaService: UserMediaService,
        conferenceService: ConferenceService,
        configSerivce: ConfigService,
        featureFlagService: FeatureFlagService,
        protected videoControlCacheService: VideoControlCacheService
    ) {
        super(
            videoCallService,
            eventService,
            deviceTypeService,
            logger,
            participantService,
            translateService,
            videoControlService,
            userMediaService
        );
        this.canToggleParticipantsPanel = true;

        conferenceService.onCurrentConferenceStatusChanged$.pipe(takeUntil(this.destroyedSubject)).subscribe(status => {
            this.conferenceStatus = status;
        });

        configSerivce
            .getClientSettings()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(settings => (this.enableDynamicEvidenceSharing = settings.enable_dynamic_evidence_sharing));
        featureFlagService
            .getFeatureFlagByName('StaffMemberFeature')
            .pipe(first())
            .subscribe(result => (this.isStaffMemberFeatureEnabled = result));
    }

    get canShowCloseHearingPopup(): boolean {
        return !this.isPrivateConsultation && this.isHost && this.displayConfirmPopup;
    }

    get canShowLeaveButton(): boolean {
        return this.isHost && !this.isPrivateConsultation && this.isStaffMemberFeatureEnabled;
    }

    get canJoinHearingFromConsultation(): boolean {
        return (
            this.conferenceStatus?.newStatus === ConferenceStatus.InSession &&
            this.participant?.status === ParticipantStatus.InConsultation &&
            this.isHost
        );
    }

    async joinHearingFromConsultation() {
        await this.videoCallService.joinHearingInSession(this.conferenceId, this.participant?.id);
    }

    canCloseOrPauseHearing() {
        return this.participant?.status === ParticipantStatus.InHearing;
    }

    canLeaveConsultation() {
        return this.participant?.status === ParticipantStatus.InConsultation;
    }

    leave(confirmation: boolean) {
        super.leave(confirmation, this.participantService.participants);
    }

    killWowza() {
        this.videoCallService.disconnectWowzaListener(this.wowzaUUID)

    }
    reconnectWowza() {
        this.videoCallService.ConnectWowzaListener();
    }
}
