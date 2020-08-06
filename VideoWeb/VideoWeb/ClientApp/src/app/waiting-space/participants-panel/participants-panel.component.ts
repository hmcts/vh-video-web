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

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, OnDestroy {
    participants: ParticipantPanelModel[] = [];
    expandPanel = true;
    isMuteAll = false;
    isLowerAllHands = true;
    conferenceId: string;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private eventService: EventsService
    ) {}

    get muteAllToggleText() {
        if (this.isMuteAll) {
            return 'Unmute All';
        } else {
            return 'Mute All';
        }
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList();
        this.setupVideoCallSubscribers();
        this.setupEventhubSubscribers();
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
        const participant = this.participants.find(x => x.displayName === updatedParticipant.pexipDisplayName);
        if (!participant) {
            return;
        }
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

    getParticipantsList() {
        this.videoWebService.getParticipantsByConferenceId(this.conferenceId).then(data => {
            if (data && data.length > 0) {
                data.filter(x => x.role !== Role.Judge).forEach(x => {
                    const participant = this.mapParticipant(x);
                    this.participants.push(participant);
                });
                this.participants.sort((x, z) => {
                    return x.orderInTheList === z.orderInTheList ? 0 : +(x.orderInTheList > z.orderInTheList) || -1;
                });
            }
        });
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
        this.videoCallService.muteParticipant(participant.displayName, !participant.isMuted);
    }

    lowerAllHands() {
        this.isLowerAllHands = !this.isLowerAllHands;
    }

    private mapParticipant(participant: ParticipantForUserResponse): ParticipantPanelModel {
        return new ParticipantPanelModel(
            participant.id,
            participant.display_name,
            participant.role,
            participant.case_type_group,
            participant.status
        );
    }
}
