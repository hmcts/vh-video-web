import { EventEmitter, Injectable, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantRemoteMuteMessage } from 'src/app/shared/models/participant-remote-mute-message';
import { HearingRole } from '../models/hearing-role-model';
import { ConnectedScreenshare, ParticipantUpdated, StoppedScreenshare } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

@Injectable()
export abstract class HearingControlsBaseComponent implements OnInit, OnDestroy {
    protected readonly loggerPrefix = '[HearingControlsBase] -';

    @Input() public participant: ParticipantResponse;
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

    audioOnly = false;

    screenShareStream: MediaStream | URL;

    audioMuted: boolean;
    videoMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;
    displayConfirmPopup: boolean;
    participantSpotlightUpdateSubscription: Subscription;
    isSpotlighted: boolean;

    private destroyedSubject = new Subject<void>();

    protected constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected participantService: ParticipantService,
        protected translateService: TranslateService,
        protected userMediaService: UserMediaService
    ) {
        this.handRaised = false;
        this.remoteMuted = false;
        this.selfViewOpen = false;
        this.isSpotlighted = false;
        this.displayConfirmPopup = false;
    }

    get canShowScreenShareButton(): boolean {
        const isNotTablet = !this.deviceTypeService.isTablet();
        const isAllowedRole = this.participant?.hearing_role !== HearingRole.WITNESS && this.participant?.role !== Role.QuickLinkObserver;
        return isNotTablet && isAllowedRole;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get isJOHConsultation(): boolean {
        return this.participant.role === Role.JudicialOfficeHolder || this.isJudge;
    }

    get isJOHRoom(): boolean {
        return this.participant?.current_room?.label.startsWith('JudgeJOH');
    }

    get logPayload() {
        return { conference: this.conferenceId, participant: this.participant.id };
    }

    ngOnInit(): void {
        this.audioMuted = this.videoCallService.pexipAPI.call.mutedAudio;
        this.videoMuted = this.videoCallService.pexipAPI.call.mutedVideo || this.audioOnly;

        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(audioOnly => {
            this.audioOnly = audioOnly;
            this.videoMuted = this.videoCallService.pexipAPI.call.mutedVideo || this.audioOnly;
        });

        this.logger.info(`${this.loggerPrefix} initialising hearing controls`, this.logPayload);

        this.setupVideoCallSubscribers();
        this.setupEventhubSubscribers();

<<<<<<< HEAD
        this.loggedInUserSubscription = this.participantService.loggedInParticipant$
            .pipe(filter(participant => participant && participant.role === Role.Judge))
=======
        this.participantService.loggedInParticipant$
            .pipe(
                takeUntil(this.destroyedSubject),
                filter(participant => participant && participant.role === Role.Judge)
            )
>>>>>>> origin
            .subscribe(participant => this.onLoggedInParticipantChanged(participant));

        if (this.isJudge) {
            this.toggleView();
        }
        this.initialiseMuteStatus();
    }

    onLoggedInParticipantChanged(participant: ParticipantModel): void {
        this.isSpotlighted = participant.isSpotlighted;

        this.participantSpotlightUpdateSubscription?.unsubscribe();
        this.participantSpotlightUpdateSubscription = this.participantService.onParticipantSpotlightStatusChanged$
            .pipe(filter(updatedParticipant => updatedParticipant.id === participant.id))
            .subscribe(updatedParticipant => {
                this.isSpotlighted = updatedParticipant.isSpotlighted;
            });
    }

    initialiseMuteStatus() {
        if (this.isPrivateConsultation && this.audioMuted) {
            this.resetMute();
        }

        if (!this.isJudge && !this.isPrivateConsultation && !this.audioMuted) {
            this.toggleMute();
        }
    }

    setupEventhubSubscribers() {
        this.eventService
            .getParticipantStatusMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(message => {
                this.handleParticipantStatusChange(message);
            });

        this.eventService
            .getHearingCountdownCompleteMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(async conferenceId => {
                await this.handleHearingCountdownComplete(conferenceId);
            });

        this.eventService
            .getParticipantHandRaisedMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(async message => {
                this.handleParticipantHandRaiseChange(message);
            });

        this.eventService
            .getParticipantRemoteMuteStatusMessage()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(async message => {
                this.handleParticipantRemoteMuteChange(message);
            });
    }

    ngOnDestroy(): void {
        this.destroyedSubject.next();
        this.destroyedSubject.complete();

        this.participantSpotlightUpdateSubscription?.unsubscribe();
        this.participantSpotlightUpdateSubscription = null;
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
        return this.participant?.current_room?.locked ?? false;
    }

    setupVideoCallSubscribers() {
        this.videoCallService
            .onParticipantUpdated()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant));

        this.videoCallService
            .onScreenshareConnected()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(connectedScreenShare => this.handleScreenShareConnected(connectedScreenShare));

        this.videoCallService
            .onScreenshareStopped()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(discconnectedScreenShare => this.handleScreenShareStopped(discconnectedScreenShare));
    }

    handleScreenShareConnected(connectedScreenShare: ConnectedScreenshare): void {
        this.logger.info(`${this.loggerPrefix} Screenshare connected`, this.logPayload);
        this.screenShareStream = connectedScreenShare.stream;
    }

    handleScreenShareStopped(disconnectedScreenShare: StoppedScreenshare): void {
        this.logger.info(`${this.loggerPrefix} Screenshare stopped. Reason ${disconnectedScreenShare.reason}`, this.logPayload);
        this.screenShareStream = null;
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        if (!updatedParticipant.pexipDisplayName.includes(this.participant.id)) {
            return false;
        }
        this.remoteMuted = updatedParticipant.isRemoteMuted;
        // hands being raised/lowered for LinkedParticipants are managed by SignalR
        if (!this.participant.linked_participants.length) {
            this.handRaised = updatedParticipant.handRaised;
        }
        if (this.remoteMuted && !this.audioMuted) {
            this.logger.info(`${this.loggerPrefix} Participant has been remote muted, muting locally too`, this.logPayload);
            this.toggleMute();
        }
        return true;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        if (message.participantId !== this.participant.id) {
            return;
        }

        if (message.status === ParticipantStatus.InConsultation) {
            this.logger.debug(`${this.loggerPrefix} Participant moved to consultation room, unmuting participant`, this.logPayload);
            this.resetMute();
        }

        this.participant.status = message.status;
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

        if (this.isJudge) {
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
        this.eventService.publishParticipantHandRaisedStatus(this.conferenceId, this.participant.id, this.handRaised);
    }

    pause() {
        this.logger.debug(`${this.loggerPrefix} Attempting to pause hearing`, this.logPayload);
        this.videoCallService.pauseHearing(this.conferenceId);
    }

    close(answer: boolean) {
        this.displayConfirmPopup = false;
        if (answer) {
            this.logger.debug(`${this.loggerPrefix} Attempting to close hearing`, this.logPayload);
            this.videoCallService.endHearing(this.conferenceId);
        }
    }

    displayConfirmationDialog() {
        this.displayConfirmPopup = true;
    }

    leavePrivateConsultation() {
        this.logger.debug(`${this.loggerPrefix} Leave private consultation clicked`, this.logPayload);
        this.leaveConsultation.emit();
    }

    lockPrivateConsultation(lock: boolean) {
        this.logger.debug(`${this.loggerPrefix} Lock private consultation clicked`, this.logPayload);
        this.lockConsultation.emit(lock);
    }

    async startScreenShare() {
        await this.videoCallService.selectScreen();
        this.videoCallService.startScreenShare();
    }

    stopScreenShare() {
        this.videoCallService.stopScreenShare();
    }

    togglePanelStatus(panelName: string) {
        this.togglePanel.emit(panelName);
    }

    changeDeviceSelected() {
        this.changeDeviceToggle.emit();
    }
}
