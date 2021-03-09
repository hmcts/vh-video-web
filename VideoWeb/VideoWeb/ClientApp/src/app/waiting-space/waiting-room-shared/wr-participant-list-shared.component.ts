import { Directive, Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse,
    LinkType
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingRole } from '../models/hearing-role-model';

@Directive()
export abstract class WRParticipantStatusListDirective {
    @Input() conference: ConferenceResponse;
    @Input() participantEndpoints: AllowedEndpointResponse[];

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    endpoints: VideoEndpointResponse[];
    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];

    participantsInConsultation: ParticipantResponse[];

    eventHubSubscriptions$ = new Subscription();
    loggedInUser: LoggedParticipantResponse;
    loggerPrefix = '[WRParticipantStatusListDirective] -';

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
        this.filterParticipantInConsultation();
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
    }

    addSharedEventHubSubcribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to ParticipantStatusMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
    }

    async handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
        const isCurrentUser = this.loggedInUser?.participant_id === message.participantId;
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
        const nonJudgeParts = this.conference.participants.filter(
            x => x.role !== Role.Judge && x.role !== Role.JudicialOfficeHolder && x.hearing_role !== HearingRole.OBSERVER
        );

        const individualWithInterpreter = nonJudgeParts.find(
            x =>
                x.role === Role.Individual &&
                x.hearing_role !== HearingRole.INTERPRETER &&
                Array.isArray(x.linked_participants) &&
                x.linked_participants.length > 0
        );
        if (!individualWithInterpreter) {
            this.nonJudgeParticipants = nonJudgeParts;
        } else {
            this.nonJudgeParticipants = this.orderForInterpreter(nonJudgeParts, individualWithInterpreter);
        }
    }

    hasInterpreterLink(participant: ParticipantResponse) {
        return participant?.linked_participants.some(x => x.link_type === LinkType.Interpreter);
    }

    getHearingRole(participant: ParticipantResponse) {
        if (participant.hearing_role === HearingRole.INTERPRETER) {
            const interpreteeName = this.getInterpreteeName(participant.id);
            return `${participant.hearing_role} for <br><strong>${interpreteeName}</strong>`;
        }
        if (participant.representee) {
            const hearingRoleText = this.isCaseTypeNone(participant) ? participant.hearing_role : 'Representative';
            return `${hearingRoleText} for <br><strong>${participant.representee}</strong>`;
        }
        return `${participant.hearing_role}`;
    }

    getInterpreteeName(interpreterId: string) {
        const interpreter = this.nonJudgeParticipants.find(x => x.id === interpreterId);
        return this.nonJudgeParticipants.find(x => x.id === interpreter.linked_participants[0].linked_id).name;
    }

    private orderForInterpreter(
        nonJudgeParticipants: ParticipantResponse[],
        individualWithInterpreter: ParticipantResponse
    ): ParticipantResponse[] {
        const linkDetails = individualWithInterpreter.linked_participants[0];
        const sortedParticipants = [individualWithInterpreter];
        const interpreter = nonJudgeParticipants.find(x => x.id === linkDetails.linked_id);
        sortedParticipants.push(interpreter);
        return [...nonJudgeParticipants.filter(p => ![individualWithInterpreter.id, interpreter.id].includes(p.id)), ...sortedParticipants];
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

    protected filterParticipantInConsultation(): void {
        if (this.loggedInUser.role === Role.Judge || this.loggedInUser.role === Role.JudicialOfficeHolder) {
            this.participantsInConsultation = [this.judge, ...this.panelMembers, ...this.wingers, ...this.nonJudgeParticipants];
        } else {
            this.participantsInConsultation = [...this.nonJudgeParticipants];
        }
    }

    get canInvite(): boolean {
        const loggedParticipant = this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);

        if (this.loggedInUser.role !== Role.Judge && this.loggedInUser.role !== Role.JudicialOfficeHolder) {
            return !loggedParticipant.current_room?.label.startsWith('JudgeJOH');
        } else {
            return true;
        }
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
