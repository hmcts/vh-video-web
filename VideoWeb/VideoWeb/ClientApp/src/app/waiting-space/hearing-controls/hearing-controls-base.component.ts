import { EventEmitter, Injectable, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { UserMediaService } from 'src/app/services/user-media.service';
import { browsers } from 'src/app/shared/browser.constants';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantRemoteMuteMessage } from 'src/app/shared/models/participant-remote-mute-message';
import { HearingRole } from '../models/hearing-role-model';
import { ConnectedScreenshare, StoppedScreenshare } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';
import { VideoControlService } from '../../services/conference/video-control.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import { ParticipantToggleLocalMuteMessage } from 'src/app/shared/models/participant-toggle-local-mute-message';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { ConferenceActions } from '../store/actions/conference.actions';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { VHParticipant } from '../store/models/vh-conference';

@Injectable()
export abstract class HearingControlsBaseComponent implements OnInit, OnDestroy {
    @Input() public isPrivateConsultation: boolean;
    @Input() public outgoingStream: MediaStream | URL;
    @Input() public conferenceId: string;
    @Input() public isSupportedBrowserForNetworkHealth: boolean;
    @Input() public showConsultationControls: boolean;
    @Input() public unreadMessageCount: number;

    @Output() public leaveConsultation = new EventEmitter();
    @Output() public lockConsultation = new EventEmitter<boolean>();
    @Output() public togglePanel = new EventEmitter<string>();
    @Output() public changeDeviceToggle = new EventEmitter();
    @Output() public changeLanguageSelected = new EventEmitter();

    audioOnly = false;

    screenShareStream: MediaStream | URL;

    audioMuted: boolean;
    videoMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;
    displayConfirmPopup: boolean;
    displayLeaveHearingPopup: boolean;
    isSpotlighted: boolean;
    showEvidenceContextMenu: boolean;
    displayChangeLayoutPopup = false;
    displayDialOutPopup = false;

    hasACamera = true;
    hasAMicrophone = true;

    sharingDynamicEvidence: boolean;
    sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);

    protected readonly loggerPrefix = '[HearingControlsBase] -';
    protected destroyedSubject = new Subject<void>();

    private _participant: VHParticipant;

    protected constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected participantService: ParticipantService,
        protected translateService: TranslateService,
        protected videoControlService: VideoControlService,
        protected userMediaService: UserMediaService,
        protected focusService: FocusService,
        protected conferenceStore: Store<ConferenceState>
    ) {
        this.handRaised = false;
        this.remoteMuted = false;
        this.selfViewOpen = true;
        this.isSpotlighted = false;
        this.displayConfirmPopup = false;
        this.showEvidenceContextMenu = false;
    }

    get participant(): VHParticipant {
        return this._participant;
    }

    get canShowScreenShareButton(): boolean {
        const isAnObserver = this.participant?.hearingRole === HearingRole.OBSERVER || this.participant?.role === Role.QuickLinkObserver;
        return this.deviceTypeService.isDesktop() && !isAnObserver && !this.sharingDynamicEvidence;
    }

    get canShowDynamicEvidenceShareButton(): boolean {
        const supportedBrowsers = [browsers.Chrome, browsers.MSEdgeChromium];
        const browser = this.deviceTypeService.getBrowserName();
        return supportedBrowsers.some(x => x.toUpperCase() === browser.toUpperCase());
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get isHost(): boolean {
        return this.participant.role === Role.Judge || this.participant.role === Role.StaffMember;
    }

    get isJOHConsultation(): boolean {
        return this.participant.role === Role.JudicialOfficeHolder || this.isJudge;
    }

    get isObserver(): boolean {
        return this.participant?.role === Role.QuickLinkObserver;
    }

    get isJOHRoom(): boolean {
        return this.participant?.room?.label.startsWith('JudgeJOH');
    }

    get isInterpreter(): boolean {
        return this.participant.hearingRole === HearingRole.INTERPRETER;
    }

    get logPayload() {
        return { conference: this.conferenceId, participant: this.participant.id };
    }

    get handToggleText(): string {
        if (this.handRaised) {
            return this.translateService.instant('hearing-controls.lower-my-hand');
        } else {
            return this.translateService.instant('hearing-controls.raise-my-hand');
        }
    }

    get videoMutedText(): string {
        return this.videoMuted
            ? this.translateService.instant('hearing-controls.switch-camera-on')
            : this.translateService.instant('hearing-controls.switch-camera-off');
    }

    get roomLocked(): boolean {
        return this.participant?.room?.locked ?? false;
    }

    get startWithAudioMuted(): boolean {
        return this.userMediaService.getConferenceSetting(this.conferenceId)?.startWithAudioMuted && !this.isPrivateConsultation;
    }

    @Input()
    set participant(value: VHParticipant) {
        this._participant = value;
        if (!value) {
            return;
        }
        this.remoteMuted = value.pexipInfo?.isRemoteMuted;
        this.handRaised = value.pexipInfo?.handRaised;

        if (this.remoteMuted && !this.audioMuted) {
            this.logger.info(`${this.loggerPrefix} Participant has been remote muted, muting locally too`, this.logPayload);
            this.toggleMute();
        }
    }

    ngOnInit(): void {
        this.audioMuted = this.videoCallService.pexipAPI.call?.mutedAudio;
        this.videoMuted = this.videoCallService.pexipAPI.call?.mutedVideo || this.audioOnly;

        this.userMediaService.checkCameraAndMicrophonePresence().then(result => {
            this.hasACamera = result.hasACamera;
            this.hasAMicrophone = result.hasAMicrophone;
        });

        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(audioOnly => {
            this.audioOnly = audioOnly;
            this.videoMuted = this.videoCallService.pexipAPI.call?.mutedVideo || this.audioOnly;
        });

        this.setupVideoCallSubscribers();
        this.setupEventhubSubscribers();

        this.conferenceStore
            .select(ConferenceSelectors.getLoggedInParticipant)
            .pipe(
                takeUntil(this.destroyedSubject),
                filter(x => !!x)
            )
            .subscribe(loggedInParticipant => {
                this.isSpotlighted = loggedInParticipant.pexipInfo?.isSpotlighted;
            });

        this.initialiseMuteStatus();
    }

    initialiseMuteStatus() {
        if (this.isPrivateConsultation && this.audioMuted) {
            this.resetMute();
        }

        if (!this.isHost && !this.isPrivateConsultation && !this.audioMuted) {
            this.toggleMute();
        }
    }

    setupEventhubSubscribers() {
        const self = this;
        this.eventService
            .getParticipantStatusMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(message => {
                self.handleParticipantStatusChange(message);
            });

        this.eventService
            .getHearingCountdownCompleteMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(conferenceId => {
                self.handleHearingCountdownComplete(conferenceId).then();
            });

        this.eventService
            .getParticipantHandRaisedMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(message => {
                self.handleParticipantHandRaiseChange(message);
            });

        this.eventService
            .getParticipantRemoteMuteStatusMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(message => {
                self.handleParticipantRemoteMuteChange(message);
            });

        this.eventService
            .getParticipantToggleLocalMuteMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(message => {
                self.handleParticipantToggleLocalMuteChange(message).then();
            });
    }

    ngOnDestroy(): void {
        this.destroyedSubject.next();
        this.destroyedSubject.complete();

        if (this.sharingDynamicEvidence) {
            this.videoCallService.stopScreenWithMicrophone();
        }
    }

    setupVideoCallSubscribers() {
        this.videoCallService
            .onScreenshareConnected()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(connectedScreenShare => this.handleScreenShareConnected(connectedScreenShare));

        this.videoCallService
            .onScreenshareStopped()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(discconnectedScreenShare => this.handleScreenShareStopped(discconnectedScreenShare));

        this.videoCallService
            .onVideoEvidenceShared()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(() => (this.sharingDynamicEvidence = true));

        this.videoCallService
            .onVideoEvidenceStopped()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(() => (this.sharingDynamicEvidence = false));
    }

    handleScreenShareConnected(connectedScreenShare: ConnectedScreenshare): void {
        this.logger.info(`${this.loggerPrefix} Screenshare connected`, this.logPayload);
        this.screenShareStream = connectedScreenShare.stream;
    }

    handleScreenShareStopped(disconnectedScreenShare: StoppedScreenshare): void {
        this.logger.info(`${this.loggerPrefix} Screenshare stopped. Reason ${disconnectedScreenShare.reason}`, this.logPayload);
        this.screenShareStream = null;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage) {
        if (message.participantId !== this.participant.id) {
            if (message.status === ParticipantStatus.InHearing) {
                this.newParticipantEnteredHandshake(message.username);
            }
            return;
        }

        if (message.status === ParticipantStatus.InConsultation) {
            this.logger.debug(`${this.loggerPrefix} Participant moved to consultation room, unmuting participant`, this.logPayload);
            this.resetMute();
        }

        this.participant.status = message.status;
    }

    async handleParticipantToggleLocalMuteChange(message: ParticipantToggleLocalMuteMessage) {
        if (message.participantId !== this.participant.id || message.conferenceId !== this.conferenceId) {
            this.logger.debug(`${this.loggerPrefix} Participant received a toggle local mute message for another conference/participant`, {
                messageParticipantId: message.participantId,
                messageConferenceId: message.conferenceId,
                currentParticipantId: this.participant.id,
                currentConferenceId: this.conferenceId
            });
            return;
        }

        if (this.remoteMuted) {
            return;
        }

        if (this.audioMuted && !message.muted) {
            await this.toggleMute();
            this.logger.info(`${this.loggerPrefix} Participant has been locally unmuted by the judge`, this.logPayload);
            return;
        }

        if (!this.audioMuted && message.muted) {
            await this.toggleMute();
            this.logger.info(`${this.loggerPrefix} Participant has been locally muted by the judge`, this.logPayload);
        }
    }

    handleParticipantRemoteMuteChange(message: ParticipantRemoteMuteMessage) {
        if (message.participantId !== this.participant.id) {
            return;
        }
        this.logger.info(
            `${this.loggerPrefix} Participant has been ${message.isRemoteMuted ? ' muted' : 'unmuted'} by the judge`,
            this.logPayload
        );
        this.remoteMuted = message.isRemoteMuted;
    }

    handleParticipantHandRaiseChange(message: ParticipantHandRaisedMessage) {
        if (message.participantId !== this.participant.id) {
            return;
        }
        this.logger.info(`${this.loggerPrefix} Participant has ${message.handRaised ? 'raised' : 'lowered'} hand`, this.logPayload);
        this.handRaised = message.handRaised;
    }

    async handleHearingCountdownComplete(conferenceId: string) {
        if (conferenceId !== this.conferenceId) {
            return;
        }

        if (this.isHost && !this.startWithAudioMuted) {
            await this.resetMute();
            return;
        }

        if (this.audioMuted) {
            this.logger.info(`${this.loggerPrefix} Countdown complete, publishing device status`, this.logPayload);
            await this.publishMediaDeviceStatus();
        } else {
            this.logger.info(`${this.loggerPrefix} Countdown complete, muting participant`, this.logPayload);
            await this.toggleMute();
        }
    }

    async resetMute() {
        if (this.audioMuted) {
            this.logger.debug(`${this.loggerPrefix} Resetting participant mute status`, this.logPayload);
            await this.toggleMute();
        }
    }

    async toggleMute() {
        this.logger.info(
            `${this.loggerPrefix} Participant is attempting to toggle own audio mute status to ${!this.audioMuted}`,
            this.logPayload
        );
        const muteAudio = this.videoCallService.toggleMute(this.conferenceId, this.participant.id);
        this.logger.info(`${this.loggerPrefix} Participant audio mute status updated to ${muteAudio}`, this.logPayload);
        this.audioMuted = muteAudio;
        await this.publishMediaDeviceStatus();
    }

    async toggleVideoMute() {
        this.logger.info(
            `${this.loggerPrefix} Participant is attempting to toggle own video mute status to ${!this.videoMuted}`,
            this.logPayload
        );
        const muteVideo = this.videoCallService.toggleVideo(this.conferenceId, this.participant.id);
        this.logger.info(`${this.loggerPrefix} Participant video mute status updated to ${muteVideo}`, this.logPayload);
        this.videoMuted = muteVideo;
        await this.publishMediaDeviceStatus();
    }

    async publishMediaDeviceStatus() {
        const mediaStatus = new ParticipantMediaStatus(this.audioMuted, this.videoMuted);
        await this.eventService.sendMediaStatus(this.conferenceId, this.participant.id, mediaStatus);
    }

    toggleView(): boolean {
        this.logger.info(`${this.loggerPrefix} Participant turning self-view ${this.selfViewOpen ? 'off' : 'on'}`, this.logPayload);
        this.selfViewOpen = !this.selfViewOpen;
        return this.selfViewOpen;
    }

    toggleHandRaised() {
        if (this.handRaised) {
            this.videoCallService.lowerHand(this.conferenceId, this.participant.id);
            this.logger.info(`${this.loggerPrefix} Participant lowered own hand`, this.logPayload);
        } else {
            this.videoCallService.raiseHand(this.conferenceId, this.participant.id);
            this.logger.info(`${this.loggerPrefix} Participant raised own hand`, this.logPayload);
        }
        this.handRaised = !this.handRaised;
        this.videoControlService.setHandRaiseStatusById(this.participant.id, this.handRaised);
        this.eventService.publishParticipantHandRaisedStatus(this.conferenceId, this.participant.id, this.handRaised);
    }

    displayLanguageChange() {
        this.focusService.storeFocus();
        this.changeLanguageSelected.emit();
    }

    pause() {
        this.focusService.storeFocus();
        this.logger.info(`${this.loggerPrefix} Attempting to pause hearing`, this.logPayload);
        this.videoCallService.pauseHearing(this.conferenceId);
    }

    close(answer: boolean) {
        this.displayConfirmPopup = false;
        if (answer) {
            this.logger.info(`${this.loggerPrefix} Attempting to close hearing`, this.logPayload);
            this.videoCallService.endHearing(this.conferenceId);
            this.sessionStorage.clear();
        } else {
            this.focusService.restoreFocus();
        }
    }

    leave(confirmation: boolean, participants: ParticipantModel[]) {
        this.displayLeaveHearingPopup = false;
        if (confirmation) {
            const isAnotherHostInHearing = this.isAnotherHostInHearing(participants);

            if (isAnotherHostInHearing) {
                this.videoCallService.leaveHearing(this.conferenceId, this.participant.id);
            } else {
                this.videoCallService.suspendHearing(this.conferenceId);
            }
        } else {
            this.focusService.restoreFocus();
        }
    }

    nonHostLeave(confirmation: boolean) {
        this.displayLeaveHearingPopup = false;
        if (confirmation) {
            this.conferenceStore.dispatch(ConferenceActions.participantLeaveHearingRoom({ conferenceId: this.conferenceId }));
        } else {
            this.focusService.restoreFocus();
        }
    }

    displayConfirmationDialog() {
        this.focusService.storeFocus();
        this.displayConfirmPopup = true;
    }

    displayConfirmationLeaveHearingDialog() {
        this.focusService.storeFocus();
        this.displayLeaveHearingPopup = true;
    }

    displayChangeLayoutDialog() {
        this.focusService.storeFocus();
        this.displayChangeLayoutPopup = true;
    }

    closeChangeLayoutDialog() {
        this.displayChangeLayoutPopup = false;
        this.focusService.restoreFocus();
    }

    onDialOutClicked() {
        this.focusService.storeFocus();
        this.displayDialOutPopup = true;
    }

    closeDialOutPopup() {
        this.displayDialOutPopup = false;
        this.focusService.restoreFocus();
    }

    leavePrivateConsultation() {
        this.focusService.storeFocus();
        this.logger.info(`${this.loggerPrefix} Leave private consultation clicked`, this.logPayload);
        this.leaveConsultation.emit();
    }

    lockPrivateConsultation(lock: boolean) {
        this.logger.info(`${this.loggerPrefix} Lock private consultation clicked`, this.logPayload);
        this.lockConsultation.emit(lock);
    }

    async startScreenShare() {
        await this.videoCallService.selectScreen();
        this.videoCallService.startScreenShare();
        this.sharingDynamicEvidence = false;
    }

    async startScreenShareWithMicrophone() {
        await this.videoCallService.selectScreenWithMicrophone();
    }

    stopScreenShare() {
        if (this.sharingDynamicEvidence) {
            this.videoCallService.stopScreenWithMicrophone();
        } else {
            this.videoCallService.stopScreenShare();
        }
    }

    togglePanelStatus(panelName: string) {
        this.togglePanel.emit(panelName);
    }

    changeDeviceSelected() {
        this.focusService.storeFocus();
        this.changeDeviceToggle.emit();
    }

    isAnotherHostInHearing(participants: ParticipantModel[]): boolean {
        const hosts = participants.filter(x => x.id !== this.participant.id && (x.role === Role.Judge || x.role === Role.StaffMember));

        if (hosts.length === 0) {
            return false;
        }

        if (hosts.some(host => host.status === ParticipantStatus.InHearing)) {
            return true;
        }

        return false;
    }

    private newParticipantEnteredHandshake(newParticipantEntered) {
        this.logger.debug(`${this.loggerPrefix} Waiting 3 seconds before sending handshake`);
        if (this.participant.hearingRole !== HearingRole.JUDGE && this.participant.hearingRole !== HearingRole.STAFF_MEMBER) {
            setTimeout(() => {
                this.logger.debug(`${this.loggerPrefix} Sending handshake for entry of: ${newParticipantEntered}`);
                this.publishMediaDeviceStatus();
                this.eventService.publishParticipantHandRaisedStatus(this.conferenceId, this.participant.id, this.handRaised);
            }, 3000); // 3Seconds: Give 2nd host time initialise participants, before receiving status updates
        }
    }
}
