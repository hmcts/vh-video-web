import { EventEmitter, Injectable, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ConnectedScreenshare, ParticipantUpdated, StoppedScreenshare } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

@Injectable()
export abstract class HearingControlsBaseComponent implements OnInit, OnDestroy {
    protected readonly loggerPrefix = '[HearingControls] -';

    @Input() public participant: ParticipantResponse;
    @Input() public isPrivateConsultation: boolean;
    @Input() public audioOnly: boolean;
    @Input() public outgoingStream: MediaStream | URL;
    @Input() public conferenceId: string;
    @Input() public isSupportedBrowserForNetworkHealth: boolean;
    @Input() public showConsultationControls: boolean;

    @Output() public leaveConsultation = new EventEmitter();
    @Output() public lockConsultation = new EventEmitter<boolean>();

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription(); 

    screenShareStream: MediaStream | URL;

    audioMuted: boolean;
    videoMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;
    displayConfirmPopup: boolean;

    protected constructor(protected videoCallService: VideoCallService, protected eventService: EventsService, protected logger: Logger) {
        this.handRaised = false;
        this.remoteMuted = false;
        this.selfViewOpen = false;
        this.displayConfirmPopup = false;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get logPayload() {
        return { conference: this.conferenceId, participant: this.participant.id };
    }

    ngOnInit(): void {
        this.audioMuted = this.videoCallService.pexipAPI.call.mutedAudio;
        this.videoMuted = this.videoCallService.pexipAPI.call.mutedVideo || this.videoCallService.isAudioOnlyCall;
        this.logger.info(`${this.loggerPrefix} initialising hearing controls`, this.logPayload);
        this.setupVideoCallSubscribers();
        this.setupEventhubSubscribers();
        if (this.isJudge) {
            this.toggleView();
        }
        this.initialiseMuteStatus();
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
        this.eventhubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
        this.eventhubSubscription$.add(
            this.eventService.getHearingCountdownCompleteMessage().subscribe(async conferenceId => {
                await this.handleHearingCountdownComplete(conferenceId);
            })
        );
    }

    ngOnDestroy(): void {
        this.videoCallSubscription$.unsubscribe();
        this.eventhubSubscription$.unsubscribe();
    }

    get handToggleText(): string {
        if (this.handRaised) {
            return 'Lower my hand';
        } else {
            return 'Raise my hand';
        }
    }

    get videoMutedText(): string {
        return this.videoMuted ? 'Switch camera on' : 'Switch camera off';
    }

    get roomLocked(): boolean {
        return this.participant?.current_room?.locked ?? false;
    }

    setupVideoCallSubscribers() {
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        ); 
        
        this.videoCallSubscription$.add(
            this.videoCallService
                .onScreenshareConnected()
                .subscribe(connectedScreenShare => this.handleScreenShareConnected(connectedScreenShare))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onScreenshareStopped()
                .subscribe(discconnectedScreenShare => this.handleScreenShareStopped(discconnectedScreenShare))
        );
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
        this.handRaised = updatedParticipant.handRaised;
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
        return (this.selfViewOpen = !this.selfViewOpen);
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
}
