import { Directive, Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConsultationAnswer,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from '../models/hearing-role-model';

@Directive()
export abstract class WRParticipantStatusListDirective {
    @Input() conference: ConferenceResponse;

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    endpoints: VideoEndpointResponse[];
    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];

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
        this.filterWingers();
        this.endpoints = this.conference.endpoints;
    }
    abstract setupSubscribers(): void;
    abstract canCallParticipant(participant: ParticipantResponse): boolean;
    abstract canCallEndpoint(endpoint: VideoEndpointResponse): boolean;

    get participantCount(): number {
        return this.nonJudgeParticipants.length + this.observers.length + this.panelMembers.length + this.wingers.length;
    }

    isCaseTypeNone(participant: ParticipantResponse): boolean {
        return participant.case_type_group === 'None';
    }

    executeTeardown(): void {
        this.consultationService.clearOutgoingCallTimeout();
        this.eventHubSubscriptions$.unsubscribe();
    }

    getConsultationRequester(): ParticipantResponse {
        return this.conference.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());
    }

    addSharedEventHubSubcribers() {
        this.eventHubSubscriptions$.add(
            this.eventService.getAdminConsultationMessage().subscribe(async message => {
                this.adminConsultationMessage = message;
                if (!message.answer) {
                    await this.displayAdminConsultationRequest(message);
                } else {
                    this.handleAdminConsultationResponse(message);
                }
            })
        );

        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
    }

    async displayAdminConsultationRequest(message: AdminConsultationMessage) {
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        if (!requestee) {
            this.logger.info(`Ignoring request for private consultation from Video Hearings Team since participant is not in hearing`);
            return;
        }
        if (!message.answer && !this.isParticipantAvailable(requestee)) {
            this.logger.info(`Ignoring request for private consultation from Video Hearings Team since participant is not available`);
            return;
        }
        this.logger.info(`Incoming request for private consultation from Video Hearings Team`);
        this.consultationRequestee = new Participant(requestee);
        await this.consultationService.displayAdminConsultationRequest();
    }

    handleAdminConsultationResponse(message: AdminConsultationMessage) {
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        if (message.answer === ConsultationAnswer.Rejected) {
            this.logger.info(`${requestee.display_name} ******* rejected vho consultation`);
            this.consultationService.cancelTimedOutIncomingRequest();
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const isCurrentUser = this.adalService.userInfo.userName.toLocaleLowerCase() === message.username.toLowerCase();
        if (isCurrentUser && message.status === ParticipantStatus.InConsultation) {
            this.closeAllPCModals();
        }
        this.filterNonJudgeParticipants();
    }

    async respondToVhoConsultationRequest(answer: ConsultationAnswer) {
        const displayName = this.videoWebService.getObfuscatedName(this.consultationRequestee.displayName);
        this.logger.event(`${displayName} responded to vho consultation: ${answer}`);
        try {
            await this.consultationService.respondToAdminConsultationRequest(
                this.conference,
                this.consultationRequestee.base,
                answer,
                this.adminConsultationMessage.roomType
            );
        } catch (error) {
            this.logger.error('Failed to respond to admin consultation request', error);
        }
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
            x =>
                x.role !== Role.Judge &&
                x.hearing_role !== HearingRole.OBSERVER &&
                x.hearing_role !== HearingRole.PANEL_MEMBER &&
                x.hearing_role !== HearingRole.WINGER
        );
    }

    protected filterObservers(): void {
        this.observers = this.conference.participants.filter(x => x.hearing_role === HearingRole.OBSERVER);
    }

    private filterWingers(): void {
        this.wingers = this.conference.participants.filter(x => x.hearing_role === HearingRole.WINGER);
    }

    protected filterPanelMembers(): void {
        this.panelMembers = this.conference.participants.filter(x => x.hearing_role === HearingRole.PANEL_MEMBER);
    }

    protected filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }

    protected camelToSpaced(word: string) {
        const splitWord = word.split(/(?=[A-Z])/).join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
    }

    protected camelToSnake(word: string) {
        return word
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase();
    }
}
