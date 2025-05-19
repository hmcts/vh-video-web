import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { filter, takeUntil } from 'rxjs/operators';
import { ConferenceStatus, HearingLayout, ParticipantStatus } from 'src/app/services/clients/api-client';
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
import { NotificationToastrService } from '../services/notification-toastr.service';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { VHConference } from '../store/models/vh-conference';
import { JoinConsultationDecider } from './models/join-consultation-decider';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { AudioRecordingActions } from '../store/actions/audio-recording.actions';

@Component({
    standalone: false,
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
    recordingPaused: boolean;
    wowzaConnected = false;
    enableMuteButton = false;

    private conferenceStatus: ConferenceStatus;

    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected translateService: TranslateService,
        protected userMediaService: UserMediaService,
        ldService: LaunchDarklyService,
        protected focusService: FocusService,
        protected conferenceStore: Store<ConferenceState>,
        protected notificationToastrService: NotificationToastrService
    ) {
        super(videoCallService, eventService, deviceTypeService, logger, translateService, userMediaService, focusService, conferenceStore);
        this.canToggleParticipantsPanel = true;

        this.conferenceStore
            .select(ConferenceSelectors.getActiveConference)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(conference => {
                this.conferenceStatus = conference.status;
                this.enableMuteButton = conference.countdownComplete || this.isPrivateConsultation;
            });

        this.conferenceStore
            .select(ConferenceSelectors.getAudioRecordingState)
            .pipe(
                filter(audioRecordingPreference => !!audioRecordingPreference),
                takeUntil(this.destroyedSubject)
            )
            .subscribe(audioRecordingState => {
                this.recordingPaused = audioRecordingState.recordingPaused;
                this.wowzaConnected = audioRecordingState.wowzaConnected;
            });

        ldService
            .getFlag<boolean>(FEATURE_FLAGS.wowzaKillButton, false)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(value => (this.isWowzaKillButtonEnabled = value));

        // Needed to prevent 'this' being undefined in the callback
        this.onLayoutUpdate = this.onLayoutUpdate.bind(this);
    }

    get canShowCloseHearingPopup(): boolean {
        return !this.isPrivateConsultation && this.isHost && this.displayConfirmPopup;
    }

    get canShowLeaveButton(): boolean {
        return !this.isPrivateConsultation;
    }

    get canDisplayChangeLayoutPopup(): boolean {
        return this.displayChangeLayoutPopup && this.isHost;
    }

    get canJoinHearingFromConsultation(): boolean {
        return JoinConsultationDecider.shouldJoinConsultation(this.conferenceStatus, this.participant?.status, this.isHost);
    }

    joinHearingFromConsultation() {
        this.conferenceStore.dispatch(
            VideoCallHostActions.joinHearing({ conferenceId: this.conferenceId, participantId: this.participant?.id })
        );
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

    pauseRecording() {
        this.conferenceStore.dispatch(AudioRecordingActions.pauseAudioRecording({ conferenceId: this.conferenceId }));
    }

    resumeRecording() {
        this.conferenceStore.dispatch(AudioRecordingActions.resumeAudioRecording({ conferenceId: this.conferenceId }));
    }
}
