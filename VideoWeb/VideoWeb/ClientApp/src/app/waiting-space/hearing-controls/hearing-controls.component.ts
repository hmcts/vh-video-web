import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-hearing-controls',
    templateUrl: './hearing-controls.component.html',
    styleUrls: ['./hearing-controls.component.scss']
})
export class HearingControlsComponent implements OnInit, OnDestroy {
    @Input() participant: ParticipantResponse;
    @Input() isPrivateConsultation: boolean;
    @Input() outgoingStream: MediaStream | URL;
    @Input() conferenceId: string;
    @Input() isSupportedBrowserForNetworkHealth: boolean;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    audioMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;
    displayConfirmPopup: boolean;

    constructor(private videoCallService: VideoCallService, private eventService: EventsService, private logger: Logger) {
        this.handRaised = false;
        this.audioMuted = false;
        this.remoteMuted = false;
        this.selfViewOpen = false;
        this.displayConfirmPopup = false;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    ngOnInit(): void {
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
            this.eventService.getHearingCountdownCompleteMessage().subscribe(conferenceId => {
                this.handleHearingCountdownComplete(conferenceId);
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

    setupVideoCallSubscribers() {
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        );
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        if (this.participant.tiled_display_name !== updatedParticipant.pexipDisplayName) {
            return false;
        }
        this.remoteMuted = updatedParticipant.isRemoteMuted;
        this.handRaised = updatedParticipant.handRaised;
        if (this.remoteMuted && !this.audioMuted) {
            this.toggleMute();
        }
        return true;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        if (message.participantId !== this.participant.id) {
            return;
        }
        if (message.status === ParticipantStatus.InConsultation) {
            this.resetMute();
        }
    }

    handleHearingCountdownComplete(conferenceId: string) {
        if (this.isJudge && conferenceId === this.conferenceId) {
            this.resetMute();
        }

        if (!this.isJudge && conferenceId === this.conferenceId && !this.audioMuted) {
            this.toggleMute();
        }
    }

    /**
     *Unmutes participants
     **/
    resetMute() {
        if (this.audioMuted) {
            this.toggleMute();
        }
    }

    toggleMute() {
        const muteAudio = this.videoCallService.toggleMute();
        this.logger.info('Participant mute status :' + muteAudio);
        this.audioMuted = muteAudio;
    }

    toggleView(): boolean {
        return (this.selfViewOpen = !this.selfViewOpen);
    }

    toggleHandRaised() {
        if (this.handRaised) {
            this.logger.debug('lowering hand');
            this.videoCallService.lowerHand();
        } else {
            this.logger.debug('raising hand');
            this.videoCallService.raiseHand();
        }
        this.handRaised = !this.handRaised;
    }

    pause() {
        this.videoCallService.pauseHearing(this.conferenceId);
    }

    close(answer: boolean) {
        this.displayConfirmPopup = false;
        if (answer) {
            this.videoCallService.endHearing(this.conferenceId);
        }
    }

    displayConfirmationDialog() {
        this.displayConfirmPopup = true;
    }
}
