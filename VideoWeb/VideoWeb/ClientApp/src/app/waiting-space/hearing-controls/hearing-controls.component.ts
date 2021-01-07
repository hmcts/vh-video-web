import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-hearing-controls',
    templateUrl: './hearing-controls.component.html',
    styleUrls: ['./hearing-controls.component.scss']
})
export class HearingControlsComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[HearingControls] -';
    @Input() participant: ParticipantResponse;
    @Input() isPrivateConsultation: boolean;
    @Input() outgoingStream: MediaStream | URL;
    @Input() conferenceId: string;
    @Input() isSupportedBrowserForNetworkHealth: boolean;
    @Input() showConsultationControls: boolean;

    @Output() leaveConsulation = new EventEmitter();

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    audioMuted: boolean;
    videoMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;
    displayConfirmPopup: boolean;

    constructor(private videoCallService: VideoCallService, private eventService: EventsService, private logger: Logger) {
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

        if (!this.isJudge && !this.audioMuted) {
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

    setupVideoCallSubscribers() {
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        );
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
        if (this.isJudge && conferenceId === this.conferenceId) {
            await this.resetMute();
        }
        console.log(`is judge ${this.isJudge}`);
        console.log(`is for conference ${conferenceId === this.conferenceId}`);
        if (this.isJudge || conferenceId !== this.conferenceId) {
            console.log('is judge or not for conference');
            return;
        }

<<<<<<< HEAD
        if (this.isJudge || conferenceId !== this.conferenceId) {
            return;
        }

        if (this.audioMuted) {
            this.logger.info(`${this.loggerPrefix} Countdown complete, publishing device status`, this.logPayload);
            await this.publishMediaDeviceStatus();
        } else {
=======
        if (this.audioMuted) {
            console.log('audio already muted');
            this.logger.info(`${this.loggerPrefix} Countdown complete, publishing device status`, this.logPayload);
            await this.publishMediaDeviceStatus();
        } else {
            console.log('audio not muted. now muting');
>>>>>>> 2660a6d468eb7c3d360c96c216788a879cf08dc9
            this.logger.info(`${this.loggerPrefix} Countdown complete, muting participant`, this.logPayload);
            await this.toggleMute();
        }
    }

    /**
     *Unmutes participants
     **/
    async resetMute() {
        if (this.audioMuted) {
            this.logger.debug(`${this.loggerPrefix} Resetting participant mute status to muted`, this.logPayload);
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

    toggleVideoMute() {
        this.logger.info(
            `${this.loggerPrefix} Participant is attempting to toggle own video mute status to ${!this.videoMuted}`,
            this.logPayload
        );
        const muteVideo = this.videoCallService.toggleVideo(this.conferenceId, this.participant.id);
        this.logger.info(`${this.loggerPrefix} Participant video mute status updated to ${muteVideo}`, this.logPayload);
        this.videoMuted = muteVideo;
    }

    async publishMediaDeviceStatus() {
        const mediaStatus = new ParticipantMediaStatus(this.audioMuted);
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
        this.leaveConsulation.emit();
    }
}
