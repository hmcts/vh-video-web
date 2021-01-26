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
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationToastrService } from '../services/notification-toastr.service';

@Directive()
export abstract class WRParticipantStatusListDirective {
    @Input() conference: ConferenceResponse;

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    endpoints: VideoEndpointResponse[];
    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];

    consultationRequestResponseMessage: ConsultationRequestResponseMessage;
    eventHubSubscriptions$ = new Subscription();

    protected constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected videoWebService: VideoWebService,
        protected logger: Logger,
        protected notificationToastrService: NotificationToastrService
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
        this.eventHubSubscriptions$.unsubscribe();
        this.consultationService.clearOutgoingCallTimeout();
    }

    getConsultationRequester(): ParticipantResponse {
        return this.conference.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());
    }

    addSharedEventHubSubcribers() {
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(async message => {
                // There has been a response to the consultation request sent
                
            })
        );
        
        this.eventHubSubscriptions$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                // A request for you to join a consultation room
                var requestedFor = new Participant(this.findParticipant(message.requestedFor));
                var requestedBy = new Participant(this.findParticipant(message.requestedBy));
                var roomParticipants = this.findParticipantsInRoom(message.roomLabel).map(x => new Participant(x));
                this.notificationToastrService.ShowConsultationInvite(message.roomLabel, message.conferenceId, requestedBy, requestedFor, roomParticipants)
            })
        );

        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const isCurrentUser = this.adalService.userInfo.userName.toLocaleLowerCase() === message.username.toLowerCase();
        if (isCurrentUser && message.status === ParticipantStatus.InConsultation) {
            this.closeAllPCModals();
        }
        this.filterNonJudgeParticipants();
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

    isWitness(participant: ParticipantResponse): boolean {
        return participant.hearing_role === HearingRole.WITNESS;
    }

    protected filterNonJudgeParticipants(): void {
        this.nonJudgeParticipants = this.conference.participants.filter(
            x => x.role !== Role.Judge && x.role !== Role.JudicialOfficeHolder && x.hearing_role !== HearingRole.OBSERVER
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

    protected findParticipant(participantId: string) : ParticipantResponse {
        return this.conference.participants.find(x => x.id === participantId)
    }

    protected findParticipantsInRoom(roomLabel: string) : ParticipantResponse[] {
        return this.conference.participants.filter(x => x.current_room?.label === roomLabel)
    }

    protected camelToSpaced(word: string) {
        const splitWord = word
        .match(/[a-z]+|[^a-z]+/gi)
        .join(' ')
        .split(/(?=[A-Z])/)
        .join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
    }

    protected camelToSnake(word: string) {
        return word
            .match(/[a-z]+|[^a-z]+/gi)
            .join('_')
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase();
    }
}
