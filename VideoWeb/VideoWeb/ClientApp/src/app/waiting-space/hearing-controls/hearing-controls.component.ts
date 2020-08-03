import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { VideoCallService } from '../services/video-call.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';
import { ParticipantUpdated } from '../models/video-call-models';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

@Component({
    selector: 'app-hearing-controls',
    templateUrl: './hearing-controls.component.html',
    styleUrls: ['./hearing-controls.component.scss']
})
export class HearingControlsComponent implements OnInit, OnDestroy {
    @Input() participant: ParticipantResponse;
    @Input() isPrivateConsultation: boolean;
    @Input() outgoingStream: MediaStream | URL;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    audioMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;
    selfViewOpen: boolean;

    constructor(private videoCallService: VideoCallService, private eventService: EventsService, private logger: Logger) {
        this.handRaised = false;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    ngOnInit(): void {
        this.setupVideoCallSubscribers();
        this.setupEventhubSubscribers();
    }

    setupEventhubSubscribers() {
        this.eventhubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
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
}
