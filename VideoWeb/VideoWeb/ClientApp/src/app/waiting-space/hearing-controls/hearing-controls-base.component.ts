import { EventEmitter, Injectable, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { browsers } from 'src/app/shared/browser.constants';
import { HearingRole } from '../models/hearing-role-model';
import { ConnectedScreenshare, StoppedScreenshare } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { VHParticipant } from '../store/models/vh-conference';
import { VideoCallActions } from '../store/actions/video-call.action';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';

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

    protected participants: VHParticipant[];
    protected readonly loggerPrefix = '[HearingControlsBase] -';
    protected destroyedSubject = new Subject<void>();

    private _participant: VHParticipant;

    protected constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected translateService: TranslateService,
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
        return this.participant?.hearingRole === HearingRole.INTERPRETER;
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
        this.updateControlBooleans(value);
    }

    ngOnInit(): void {
        this.userMediaService.checkCameraAndMicrophonePresence().then(result => {
            this.hasACamera = result.hasACamera;
            this.hasAMicrophone = result.hasAMicrophone;
        });

        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(audioOnly => {
            this.audioOnly = audioOnly;
            this.videoMuted = this.videoCallService.pexipAPI.call?.mutedVideo || this.audioOnly;
        });

        this.setupVideoCallSubscribers();

        this.conferenceStore
            .select(ConferenceSelectors.getLoggedInParticipant)
            .pipe(
                takeUntil(this.destroyedSubject),
                filter(x => !!x)
            )
            .subscribe(loggedInParticipant => this.updateControlBooleans(loggedInParticipant));

        this.conferenceStore
            .select(ConferenceSelectors.getParticipants)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(participants => {
                this.participants = participants;
            });
    }

    /**
     * Update the current participant conference settings
     */
    updateControlBooleans(participant: VHParticipant) {
        this.remoteMuted = participant.pexipInfo?.isRemoteMuted;
        this.handRaised = participant.pexipInfo?.handRaised;
        this.audioMuted = participant.localMediaStatus?.isMicrophoneMuted;
        this.videoMuted = participant.localMediaStatus?.isCameraOff;
        this.isSpotlighted = participant.pexipInfo?.isSpotlighted;
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

    toggleMute() {
        this.logger.info(
            `${this.loggerPrefix} Participant is attempting to toggle own audio mute status to ${!this.audioMuted}`,
            this.logPayload
        );
        this.conferenceStore.dispatch(VideoCallActions.toggleAudioMute());
    }

    toggleVideoMute() {
        this.logger.info(
            `${this.loggerPrefix} Participant is attempting to toggle own video mute status to ${!this.videoMuted}`,
            this.logPayload
        );
        this.conferenceStore.dispatch(VideoCallActions.toggleOutgoingVideo());
    }

    toggleView(): boolean {
        this.logger.info(`${this.loggerPrefix} Participant turning self-view ${this.selfViewOpen ? 'off' : 'on'}`, this.logPayload);
        this.selfViewOpen = !this.selfViewOpen;
        return this.selfViewOpen;
    }

    toggleHandRaised() {
        if (this.handRaised) {
            this.conferenceStore.dispatch(VideoCallActions.lowerHand());
        } else {
            this.conferenceStore.dispatch(VideoCallActions.raiseHand());
        }
    }

    displayLanguageChange() {
        this.focusService.storeFocus();
        this.changeLanguageSelected.emit();
    }

    pause() {
        this.focusService.storeFocus();
        this.logger.info(`${this.loggerPrefix} Attempting to pause hearing`, this.logPayload);
        this.conferenceStore.dispatch(VideoCallHostActions.pauseHearing({ conferenceId: this.conferenceId }));
    }

    close(answer: boolean) {
        this.displayConfirmPopup = false;
        if (answer) {
            this.logger.info(`${this.loggerPrefix} Attempting to close hearing`, this.logPayload);
            this.conferenceStore.dispatch(VideoCallHostActions.endHearing({ conferenceId: this.conferenceId }));
            this.sessionStorage.clear();
        } else {
            this.focusService.restoreFocus();
        }
    }

    leave(confirmation: boolean, participants: VHParticipant[]) {
        this.displayLeaveHearingPopup = false;
        if (confirmation) {
            const isAnotherHostInHearing = this.isAnotherHostInHearing(participants);

            if (isAnotherHostInHearing) {
                this.conferenceStore.dispatch(
                    VideoCallHostActions.hostLeaveHearing({ conferenceId: this.conferenceId, participantId: this.participant.id })
                );
            } else {
                this.logger.info(`${this.loggerPrefix} Attempting to suspend hearing because no host left after leaving`, this.logPayload);
                this.conferenceStore.dispatch(VideoCallHostActions.suspendHearing({ conferenceId: this.conferenceId }));
            }
        } else {
            this.focusService.restoreFocus();
        }
    }

    nonHostLeave(confirmation: boolean) {
        this.displayLeaveHearingPopup = false;
        if (confirmation) {
            this.conferenceStore.dispatch(VideoCallActions.participantLeaveHearingRoom({ conferenceId: this.conferenceId }));
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

    isAnotherHostInHearing(participants: VHParticipant[]): boolean {
        const hosts = participants.filter(x => x.id !== this.participant.id && (x.role === Role.Judge || x.role === Role.StaffMember));

        if (hosts.length === 0) {
            return false;
        }

        if (hosts.some(host => host.status === ParticipantStatus.InHearing)) {
            return true;
        }

        return false;
    }
}
