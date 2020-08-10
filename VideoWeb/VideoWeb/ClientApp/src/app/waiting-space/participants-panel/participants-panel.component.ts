import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantForUserResponse, Role, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, OnDestroy {
    participants: ParticipantPanelModel[] = [];
    expandPanel = true;
    isMuteAll = false;
    conferenceId: string;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private eventService: EventsService,
        private logger: Logger
    ) {}

    get muteAllToggleText() {
        if (this.isMuteAll) {
            return 'Unmute all';
        } else {
            return 'Mute all';
        }
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList().then(() => {
            this.setupVideoCallSubscribers();
            this.setupEventhubSubscribers();
        });
    }

    ngOnDestroy(): void {
        this.videoCallSubscription$.unsubscribe();
        this.eventhubSubscription$.unsubscribe();
    }

    setupVideoCallSubscribers() {
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onConferenceUpdated()
                .subscribe(updatedConference => this.handleUpdatedConferenceVideoCall(updatedConference))
        );
    }

    setupEventhubSubscribers() {
        this.eventhubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
    }

    handleUpdatedConferenceVideoCall(updatedConference: ConferenceUpdated): void {
        this.isMuteAll = updatedConference.guestedMuted;
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        const participant = this.participants.find(x => x.pexipDisplayName === updatedParticipant.pexipDisplayName);
        if (!participant) {
            return;
        }
        participant.pexipId = updatedParticipant.uuid;
        participant.isMuted = updatedParticipant.isRemoteMuted;
        participant.handRaised = updatedParticipant.handRaised;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const participant = this.participants.find(x => x.participantId === message.participantId);
        if (!participant) {
            return;
        }
        participant.status = message.status;
    }

    async getParticipantsList() {
        try {
            const data = await this.videoWebService.getParticipantsByConferenceId(this.conferenceId);

            data.filter(x => x.role !== Role.Judge).forEach(x => {
                const participant = this.mapParticipant(x);
                this.participants.push(participant);
            });
            this.participants.sort((x, z) => {
                return x.orderInTheList === z.orderInTheList ? 0 : +(x.orderInTheList > z.orderInTheList) || -1;
            });
        } catch (err) {
            this.logger.error('Failed to get participants for judge hearing panel', err);
        }
    }

    isParticipantInHearing(participant: ParticipantPanelModel): boolean {
        return participant.status === ParticipantStatus.InHearing;
    }

    toggleCollapseExpand() {
        this.expandPanel = !this.expandPanel;
    }

    toggleMuteAll() {
        this.videoCallService.muteAllParticipants(!this.isMuteAll);
    }

    toggleMuteParticipant(participant: ParticipantPanelModel) {
        const p = this.participants.find(x => x.participantId === participant.participantId);
        this.videoCallService.muteParticipant(p.pexipId, !p.isMuted);
    }

    lowerAllHands() {
        this.videoCallService.lowerAllHands();
    }

    lowerParticipantHand(participantId: string) {
        const participant = this.participants.find(x => x.participantId === participantId);
        this.videoCallService.lowerHandById(participant.pexipId);
    }

    private mapParticipant(participant: ParticipantForUserResponse): ParticipantPanelModel {
        return new ParticipantPanelModel(
            participant.id,
            participant.display_name,
            participant.role,
            participant.case_type_group,
            participant.status,
            participant.pexip_display_name
        );
    }
}
