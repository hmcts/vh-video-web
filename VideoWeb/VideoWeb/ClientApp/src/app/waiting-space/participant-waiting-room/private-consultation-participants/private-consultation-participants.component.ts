import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConsultationAnswer, ParticipantResponse, ParticipantStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-private-consultation-participants',
    templateUrl: './private-consultation-participants.component.html',
    styleUrls: ['./private-consultation-participants.component.scss']
})
export class PrivateConsultationParticipantsComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    @Input() roomLabel: string;
    participantCallStatuses = [];

    constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute
    ) {
        super(adalService, consultationService, eventService, videoWebService, logger);
        this.loggerPrefix = '[PrivateConsultationParticipantsComponent] - ';
    }

    ngOnInit(): void {
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.setupSubscribers();
        this.setupInviteStatusSubscribers();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    setupInviteStatusSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to ConsultationRequestResponseMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(message => {
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = message.answer;
                    setTimeout(() => {
                        if (this.participantCallStatuses[message.requestedFor] === message.answer) {
                            this.participantCallStatuses[message.requestedFor] = null;
                        }
                    }, 10000);
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                // Set 'Calling...'
                // No need to timeout here the text because when the notification times out it will send another event.
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = 'Calling';
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to ParticipantStatusMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                // If the participant state changes reset the state.
                this.participantCallStatuses[message.participantId] = null;
            })
        );
    }

    getRowClasses(participant: ParticipantResponse): string {
        if (this.participantIsInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (this.participantIsInCurrentRoom(participant)) {
            return '';
        }
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return 'Calling...';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return 'Declined';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return 'Failed';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return 'No Answer';
        }
        if (participant.current_room?.label) {
            return (
                this.camelToSpaced(participant.current_room?.label.replace('ParticipantConsultation', '')) +
                (participant.current_room?.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }

        if (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) {
            return 'Not available';
        }
    }

    participantAvailable(participant: ParticipantResponse): boolean {
        return !(participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation);
    }

    participantNameClass(participant: ParticipantResponse): string {
        if (this.participantIsInCurrentRoom(participant)) {
            return 'yellow';
        }

        return this.participantAvailable(participant) ? 'white' : '';
    }

    participantIsInCurrentRoom(participant: ParticipantResponse): boolean {
        return participant.current_room?.label === this.roomLabel;
    }

    getParticipantStatusClasses(participant: ParticipantResponse): string {
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return 'yellow';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return 'red';
        }
        if (participant.status === ParticipantStatus.InConsultation && !this.participantIsInCurrentRoom(participant)) {
            return 'outline';
        }
        return 'white';
    }

    setupSubscribers(): void {
        this.addSharedEventHubSubcribers();
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        return !this.participantIsInCurrentRoom(participant) && participant.status === ParticipantStatus.Available;
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return true;
    }
}
