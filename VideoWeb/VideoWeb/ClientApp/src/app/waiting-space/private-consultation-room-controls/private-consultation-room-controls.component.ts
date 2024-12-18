import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { ConferenceStatus, HearingLayout, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceService } from 'src/app/services/conference/conference.service';
import { ConferenceStatusChanged } from 'src/app/services/conference/models/conference-status-changed.model';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { VideoCallService } from '../services/video-call.service';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { FocusService } from 'src/app/services/focus.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { faCirclePause, faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { VHConference } from '../store/models/vh-conference';

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
    outputs: ['leaveConsultation', 'lockConsultation', 'togglePanel', 'changeDeviceToggle', 'leaveHearing', 'changeLanguageSelected']
})
export class PrivateConsultationRoomControlsComponent extends HearingControlsBaseComponent {
    @Input() public canToggleParticipantsPanel: boolean;
    @Input() public isChatVisible: boolean;
    @Input() public areParticipantsVisible: boolean;
    @Input() public conference: VHConference;

    featureFlags = FEATURE_FLAGS;

    showContextMenu = false;
    isWowzaKillButtonEnabled = false;
    vodafoneEnabled = false;
    pauseIcon = faCirclePause;
    playIcon = faPlayCircle;
    recordingPaused: boolean;
    recordingButtonDisabled = false;
    wowzaConnected = false;

    private conferenceStatus: ConferenceStatusChanged;

    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected translateService: TranslateService,
        protected userMediaService: UserMediaService,
        conferenceService: ConferenceService,
        ldService: LaunchDarklyService,
        protected focusService: FocusService,
        protected conferenceStore: Store<ConferenceState>,
        protected audioRecordingService: AudioRecordingService,
        protected notificationToastrService: NotificationToastrService
    ) {
        super(videoCallService, eventService, deviceTypeService, logger, translateService, userMediaService, focusService, conferenceStore);
        this.canToggleParticipantsPanel = true;

        conferenceService.onCurrentConferenceStatusChanged$.pipe(takeUntil(this.destroyedSubject)).subscribe(status => {
            this.conferenceStatus = status;
        });

        ldService
            .getFlag<boolean>(FEATURE_FLAGS.wowzaKillButton, false)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(value => (this.isWowzaKillButtonEnabled = value));
        ldService
            .getFlag<boolean>(FEATURE_FLAGS.vodafone, false)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(value => {
                this.vodafoneEnabled = value;
            });

        this.audioRecordingService
            .getWowzaAgentConnectionState()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(connected => {
                this.wowzaConnected = connected;
            });

        // Needed to prevent 'this' being undefined in the callback
        this.onLayoutUpdate = this.onLayoutUpdate.bind(this);

        this.audioRecordingService.getAudioRecordingPauseState().subscribe(async (audioStopped: boolean) => {
            this.recordingPaused = audioStopped;
        });
    }

    get canShowCloseHearingPopup(): boolean {
        return !this.isPrivateConsultation && this.isHost && this.displayConfirmPopup;
    }

    get canShowLeaveButton(): boolean {
        return this.vodafoneEnabled ? !this.isPrivateConsultation : this.isHost && !this.isPrivateConsultation;
    }

    get canDisplayChangeLayoutPopup(): boolean {
        return this.displayChangeLayoutPopup && this.isHost;
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
        if (this.isHost) {
            super.leave(confirmation, this.participants);
        } else {
            super.nonHostLeave(confirmation);
        }
    }

    onLayoutUpdate(layout: HearingLayout) {
        const mappedLayout = this.mapLayout(layout);
        this.videoCallService.transformLayout(mappedLayout);
    }

    mapLayout(layout: HearingLayout) {
        // See https://docs.pexip.com/api_client/api_pexrtc.htm#transformlayout
        let mappedLayout = '';
        switch (layout) {
            case HearingLayout.OnePlus7:
                mappedLayout = '1:7';
                break;
            case HearingLayout.TwoPlus21:
                mappedLayout = '2:21';
                break;
            case HearingLayout.Dynamic:
                mappedLayout = 'ac';
                break;
            case HearingLayout.NineEqual:
                mappedLayout = '3x3';
                break;
            case HearingLayout.SixteenEqual:
                mappedLayout = '4x4';
                break;
            case HearingLayout.TwentyFiveEqual:
                mappedLayout = '5x5';
                break;
        }
        return mappedLayout;
    }

    async pauseRecording() {
        if (this.recordingButtonDisabled) {
            return;
        }
        this.recordingButtonDisabled = true;
        await this.audioRecordingService.stopRecording();
        setTimeout(() => {
            this.recordingButtonDisabled = false;
        }, 5000);
    }

    async resumeRecording() {
        if (this.recordingButtonDisabled) {
            return;
        }
        this.recordingButtonDisabled = true;
        await this.audioRecordingService.reconnectToWowza(null);
        setTimeout(() => {
            this.recordingButtonDisabled = false;
        }, 5000);
    }
}
