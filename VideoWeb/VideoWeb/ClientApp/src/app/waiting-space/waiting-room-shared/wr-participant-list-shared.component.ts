import { Directive, DoCheck, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    EndpointStatus,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';
import { CaseTypeGroup } from '../models/case-type-group';

import { HearingRole } from '../models/hearing-role-model';

@Directive()
export abstract class WRParticipantStatusListDirective implements DoCheck {
    @Input() conference: ConferenceResponse;
    @Input() participantEndpoints: AllowedEndpointResponse[];

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    staffMembers: ParticipantResponse[];
    endpoints: VideoEndpointResponse[];
    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];

    eventHubSubscriptions$ = new Subscription();
    loggedInUser: LoggedParticipantResponse;
    loggerPrefix = '[WRParticipantStatusListDirective] -';

    private displayedParticipants: ParticipantResponse[] = null;

    protected constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected videoWebService: VideoWebService,
        protected logger: Logger,
        protected translateService: TranslateService
    ) {}

    ngDoCheck(): void {
        if (this.displayedParticipants !== this.conference.participants) {
            this.initParticipants();
            this.displayedParticipants = this.conference.participants;
        }
    }

    initParticipants() {
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.filterStaffMember();
        this.filterPanelMembers();
        this.filterObservers();
        this.filterWingers();
        this.endpoints = this.conference.endpoints;
    }

    get participantCount(): number {
        return (
            this.nonJudgeParticipants.length +
            this.observers.length +
            this.panelMembers.length +
            this.wingers.length +
            this.staffMembers.length
        );
    }

    isCaseTypeNone(participant: ParticipantResponse): boolean {
        return !participant.case_type_group || participant.case_type_group === 'None';
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
        let nonJudgeParts = this.conference.participants
            .filter(
                x =>
                    x.role !== Role.Judge &&
                    x.role !== Role.JudicialOfficeHolder &&
                    x.case_type_group !== CaseTypeGroup.OBSERVER &&
                    x.hearing_role !== HearingRole.OBSERVER &&
                    x.role !== Role.QuickLinkObserver &&
                    x.role !== Role.QuickLinkParticipant &&
                    x.hearing_role !== HearingRole.STAFF_MEMBER
            )
            .sort((a, b) => a.case_type_group.localeCompare(b.case_type_group) || a.name.localeCompare(b.name));

        nonJudgeParts = [
            ...nonJudgeParts,
            ...this.conference.participants
                .filter(x => x.role === Role.QuickLinkParticipant)
                .sort((a, b) => a.display_name.localeCompare(b.display_name))
        ];

        this.nonJudgeParticipants = nonJudgeParts;
    }

    hasInterpreterLink(participant: ParticipantResponse) {
        return participant?.linked_participants.some(x => x.link_type === LinkType.Interpreter);
    }

    getHearingRole(participant: ParticipantResponse) {
        const translatedHearingRole = this.translateService.instant('hearing-role.' + this.stringToTranslateId(participant.hearing_role));
        const translatedFor = this.translateService.instant('wr-participant-list-shared.for');
        if (participant.hearing_role === HearingRole.INTERPRETER) {
            const interpreteeName = this.getInterpreteeName(participant.id);
            return `${translatedHearingRole} ${translatedFor} <br><strong>${interpreteeName}</strong>`;
        }
        if (participant.representee) {
            const translatedRepresentative = this.translateService.instant('wr-participant-list-shared.representative');
            const hearingRoleText = this.isCaseTypeNone(participant) ? translatedHearingRole : translatedRepresentative;
            return `${hearingRoleText} ${translatedFor} <br><strong>${participant.representee}</strong>`;
        }
        return `${translatedHearingRole}`;
    }

    stringToTranslateId(str: string) {
        return str?.replace(/\s/g, '-').toLowerCase();
    }

    getInterpreteeName(interpreterId: string) {
        const interpreter = this.nonJudgeParticipants.find(x => x.id === interpreterId);
        return this.nonJudgeParticipants.find(x => x.id === interpreter.linked_participants[0].linked_id).name;
    }

    protected filterObservers(): void {
        this.observers = this.conference.participants
            .filter(
                x =>
                    x.case_type_group === CaseTypeGroup.OBSERVER ||
                    x.hearing_role === HearingRole.OBSERVER ||
                    x.role === Role.QuickLinkObserver
            )
            .sort((a, b) => a.display_name.localeCompare(b.display_name));
    }

    private filterWingers(): void {
        this.wingers = this.conference.participants.filter(x => x.hearing_role === HearingRole.WINGER);
    }

    protected filterPanelMembers(): void {
        this.panelMembers = this.conference.participants.filter(x => this.isParticipantPanelMember(x.hearing_role));
    }
    protected isParticipantPanelMember(hearingRole: string): boolean {
        return HearingRoleHelper.isPanelMember(hearingRole);
    }

    protected filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }

    protected filterStaffMember(): void {
        this.staffMembers = this.conference.participants.filter(x => x.role === Role.StaffMember);
    }

    get canInvite(): boolean {
        const isJudicialUser = this.loggedInUser.role === Role.Judge || this.loggedInUser.role === Role.JudicialOfficeHolder;
        const isStaffMember = this.loggedInUser.role === Role.StaffMember;

        if (isJudicialUser || isStaffMember) {
            return true;
        } else {
            const loggedInParticipant = this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
            const hasLinkedParticipants = loggedInParticipant.linked_participants.length;
            const currentRoomIsJudicial = loggedInParticipant.current_room?.label.startsWith('JudgeJOH');

            return !currentRoomIsJudicial && !hasLinkedParticipants;
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
