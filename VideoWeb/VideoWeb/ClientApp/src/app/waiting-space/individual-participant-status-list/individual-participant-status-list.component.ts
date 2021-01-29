import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConsultationAnswer, ParticipantResponse, ParticipantStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from '../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';

@Component({
    selector: 'app-individual-participant-status-list',
    templateUrl: './individual-participant-status-list.component.html',
    styleUrls: ['./individual-participant-status-list.component.scss']
})
export class IndividualParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    wingers: ParticipantResponse[];
    constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService
    ) {
        super(adalService, consultationService, eventService, videoWebService, logger);
    }

    async ngOnInit() {
        this.consultationService.resetWaitingForResponse();
        this.initParticipants();
        this.setupSubscribers();
        await this.setCurrentParticipant();
    }

    ngOnDestroy(): void {
        this.executeTeardown();
    }

    setupSubscribers() {
        this.addSharedEventHubSubcribers();
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationMessage().subscribe(message => {
                switch (message.result) {
                    case ConsultationAnswer.Accepted:
                    case ConsultationAnswer.Rejected:
                    case ConsultationAnswer.Cancelled:
                        this.consultationService.handleConsultationResponse(message.result);
                        break;
                    case ConsultationAnswer.NoRoomsAvailable:
                        this.handleNoConsulationRoom();
                        break;
                    default:
                        this.displayConsultationRequestPopup(message);
                        break;
                }
            })
        );
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }

        const requester = this.getConsultationRequester();
        if (
            requester.hearing_role === HearingRole.OBSERVER ||
            requester.hearing_role === HearingRole.PANEL_MEMBER ||
            requester.hearing_role === HearingRole.WINGER ||
            requester.hearing_role === HearingRole.WITNESS
        ) {
            return false;
        }

        if (participant.id === this.loggedInUser.participant_id) {
            return false;
        }
        return this.isParticipantAvailable(participant);
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }
        if (!endpoint.defence_advocate_username) {
            return false;
        }
        if (
            endpoint.defence_advocate_username.toLocaleLowerCase().trim() !== this.adalService.userInfo.userName.toLocaleLowerCase().trim()
        ) {
            return false;
        }

        return this.isEndpointAvailable(endpoint);
    }

    async beginCallWith(participant: ParticipantResponse): Promise<void> {
        if (!this.canCallParticipant(participant)) {
            return;
        }
        const requestee = this.conference.participants.find(x => x.id === participant.id);
        const requester = this.getConsultationRequester();

        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
        this.logger.info(
            `[IndividualParticipantStatusList] - ${this.videoWebService.getObfuscatedName(
                requester.id
            )} requesting private consultation with ${this.videoWebService.getObfuscatedName(requestee.id)}`,
            {
                conference: this.conference.id,
                requester: this.consultationRequester.id,
                requestee: this.consultationRequestee.id
            }
        );

        try {
            await this.consultationService.raiseConsultationRequest(this.conference, requester, requestee);
            this.logger.info('[IndividualParticipantStatusList] - Raised consultation request event');
        } catch (error) {
            this.logger.error('[IndividualParticipantStatusList] - Failed to raise consultation request', error);
        }
    }

    async beginEndpointCallWith(endpoint: VideoEndpointResponse) {
        if (!this.canCallEndpoint(endpoint)) {
            return;
        }
        this.logger.debug(`[IndividualParticipantStatusList] - attempting to video call ${endpoint.display_name}`);
        try {
            await this.consultationService.startPrivateConsulationWithEndpoint(this.conference, endpoint);
            this.logger.info('[IndividualParticipantStatusList] - Starting private consultation with endpoint');
        } catch (error) {
            this.logger.error('[IndividualParticipantStatusList] - Failed to raise private consultation with endpoint', error);
        }
    }

    async cancelConsultationRequest() {
        await this.answerConsultationRequest(ConsultationAnswer.Cancelled);
    }

    private async displayConsultationRequestPopup(message: ConsultationMessage) {
        this.initConsultationParticipants(message);

        this.logger.info(
            `[IndividualParticipantStatusList] - Incoming request for private consultation from ${this.videoWebService.getObfuscatedName(
                this.consultationRequester.displayName
            )}`
        );
        this.consultationService.displayIncomingPrivateConsultation();
    }

    async answerConsultationRequest(consultationAnswer: ConsultationAnswer) {
        this.logger.info(
            `[IndividualParticipantStatusList] - ${this.consultationRequestee.id} responded to consultation: ${consultationAnswer}`,
            {
                conference: this.conference.id,
                requester: this.consultationRequester.id,
                requestee: this.consultationRequestee.id,
                answer: consultationAnswer
            }
        );
        this.logger.info(
            `[IndividualParticipantStatusList] - ${this.consultationRequestee.displayName} responded to consultation: ${consultationAnswer}`
        );
        try {
            await this.consultationService.respondToConsultationRequest(
                this.conference,
                this.consultationRequester.base,
                this.consultationRequestee.base,
                consultationAnswer
            );
        } catch (error) {
            this.logger.error('[IndividualParticipantStatusList] - Failed to respond to consultation request', error);
        }
    }

    private initConsultationParticipants(message: ConsultationMessage): void {
        const requester = this.conference.participants.find(x => x.id === message.requestedBy);
        const requestee = this.conference.participants.find(x => x.id === message.requestedFor);
        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
    }
}
