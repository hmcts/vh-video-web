import { Directive, Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { Participant } from 'src/app/shared/models/participant';
import { CaseTypeGroup } from '../models/case-type-group';

@Directive()
export abstract class WRParticipantStatusListDirective {
    @Input() conference: ConferenceResponse;

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    endpoints: VideoEndpointResponse[];
    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];

    consultationRequestee: Participant;
    consultationRequester: Participant;

    adminConsultationMessage: AdminConsultationMessage;
    eventHubSubscriptions$ = new Subscription();

    protected constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected videoWebService: VideoWebService,
        protected logger: Logger
    ) {}

    initParticipants() {
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.filterPanelMembers();
        this.filterObservers();
        this.endpoints = this.conference.endpoints;
        this.setupSubscribers();
    }
    abstract setupSubscribers(): void;
    abstract canCallParticipant(participant: ParticipantResponse): boolean;
    abstract canCallEndpoint(endpoint: VideoEndpointResponse): boolean;

    get participantsCount(): number {
        return this.nonJudgeParticipants.length + this.observers.length + this.panelMembers.length;
    }

    isCaseTypeNone(participant: ParticipantResponse): boolean {
        return participant.case_type_group === 'None';
    }

    executeTeardown(): void {
        this.consultationService.clearOutoingCallTimeout();
        this.eventHubSubscriptions$.unsubscribe();
    }

    getConsultationRequester(): ParticipantResponse {
        return this.conference.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());
    }

    async handleAdminConsultationMessage(message: AdminConsultationMessage) {
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        if (!this.isParticipantAvailable(requestee)) {
            this.logger.info(`Ignoring request for private consultation from Video Hearings Team since participant is not available`);
            return;
        }
        this.logger.info(`Incoming request for private consultation from Video Hearings Team`);
        this.consultationRequestee = new Participant(requestee);
        this.consultationService.displayAdminConsultationRequest();
    }

    handleNoConsulationRoom() {
        this.consultationService.displayNoConsultationRoomAvailableModal();
    }

    closeAllPCModals(): void {
        this.consultationService.clearModals();
    }

    isParticipantAvailable(participant: ParticipantResponse): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    isEndpointAvailable(endpoint: VideoEndpointResponse): boolean {
        return endpoint.status === EndpointStatus.Connected;
    }

    protected filterNonJudgeParticipants(): void {
        this.nonJudgeParticipants = this.conference.participants.filter(
            x => x.role !== Role.Judge && x.case_type_group !== CaseTypeGroup.OBSERVER && x.case_type_group !== CaseTypeGroup.PANEL_MEMBER
        );
    }

    protected filterObservers(): void {
        this.observers = this.conference.participants.filter(x => x.case_type_group === CaseTypeGroup.OBSERVER);
    }

    protected filterPanelMembers(): void {
        this.panelMembers = this.conference.participants.filter(x => x.case_type_group === CaseTypeGroup.PANEL_MEMBER);
    }

    protected filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }
}
