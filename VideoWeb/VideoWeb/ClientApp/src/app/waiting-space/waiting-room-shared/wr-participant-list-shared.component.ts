import { Directive, Input, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EndpointStatus, LinkType, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';

import { HearingRole } from '../models/hearing-role-model';
import { FocusService } from 'src/app/services/focus.service';
import { VHConference, VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import { ConsultationRules } from 'src/app/services/models/consultation-rules';
import { SortingHelper } from 'src/app/shared/helpers/sorting-helper';

@Directive()
export abstract class WRParticipantStatusListDirective implements OnChanges {
    @Input() participantEndpoints: VHEndpoint[];

    nonJudgeParticipants: VHParticipant[] = [];
    judge: VHParticipant;
    staffMembers: VHParticipant[] = [];
    endpoints: VHEndpoint[] = [];
    observers: VHParticipant[] = [];
    panelMembers: VHParticipant[] = [];
    wingers: VHParticipant[] = [];

    displayParticipantList = false;

    eventHubSubscriptions$ = new Subscription();
    loggedInUser: LoggedParticipantResponse;
    loggerPrefix = '[WRParticipantStatusListDirective] -';

    protected consultationRules: ConsultationRules;

    private _conference: VHConference;

    protected constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected videoWebService: VideoWebService,
        protected logger: Logger,
        protected translateService: TranslateService,
        protected focusService: FocusService
    ) {}

    get canInvite(): boolean {
        const isJudicialUser = this.loggedInUser.role === Role.Judge || this.loggedInUser.role === Role.JudicialOfficeHolder;
        const isStaffMember = this.loggedInUser.role === Role.StaffMember;

        if (isJudicialUser || isStaffMember) {
            return true;
        } else {
            const loggedInParticipant = this._conference.participants.find(x => x.id === this.loggedInUser.participant_id);
            const hasLinkedParticipants = loggedInParticipant.linkedParticipants.length;
            const currentRoomIsJudicial = loggedInParticipant.room?.label.startsWith('JudgeJOH');

            return !currentRoomIsJudicial && !hasLinkedParticipants;
        }
    }

    get conference(): VHConference {
        return this._conference;
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

    @Input() set conference(conference: VHConference) {
        this._conference = conference;
        this.consultationRules = new ConsultationRules(conference);
        this.initParticipants();
    }

    ngOnChanges() {
        if (!this._conference) {
            return;
        }
        this.initParticipants();
        this.displayParticipantList = this.participantCount > 0 || this.endpoints.length > 0;
    }

    initParticipants() {
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.filterStaffMember();
        this.filterPanelMembers();
        this.filterObservers();
        this.filterWingers();
        this.sortEndpoints();
    }

    executeTeardown(): void {
        this.eventHubSubscriptions$.unsubscribe();
    }

    addSharedEventHubSubcribers() {
        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage) {
        const isCurrentUser = this.loggedInUser?.participant_id === message.participantId;
        if (isCurrentUser && message.status === ParticipantStatus.InConsultation) {
            this.closeAllPCModals();
        }
        this.filterNonJudgeParticipants();
    }

    closeAllPCModals(): void {
        this.consultationService.clearModals();
        this.focusService.restoreFocus();
    }

    isParticipantAvailable(participant: VHParticipant): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    isEndpointAvailable(endpoint: VHEndpoint): boolean {
        return endpoint.status === EndpointStatus.Connected;
    }

    isWitness(participant: VHParticipant): boolean {
        return participant.hearingRole === HearingRole.WITNESS || participant.hearingRole === HearingRole.EXPERT;
    }

    hasInterpreterLink(participant: VHParticipant) {
        return participant?.linkedParticipants.some(x => x.linkedType === LinkType.Interpreter);
    }

    getHearingRole(participant: VHParticipant) {
        const translatedHearingRole = this.translateService.instant('hearing-role.' + this.stringToTranslateId(participant.hearingRole));
        const translatedFor = this.translateService.instant('wr-participant-list-shared.for');
        if (participant.hearingRole === HearingRole.INTERPRETER) {
            const interpreteeName = this.getInterpreteeName(participant.id);
            if (interpreteeName) {
                return `${translatedHearingRole} ${translatedFor} <br><strong>${interpreteeName}</strong>`;
            }
            return translatedHearingRole;
        }
        if (participant.representee) {
            const translatedRepresentative = this.translateService.instant('wr-participant-list-shared.representative');
            const hearingRoleText = translatedRepresentative;
            return `${hearingRoleText} ${translatedFor} <br><strong>${participant.representee}</strong>`;
        }
        return `${translatedHearingRole}`;
    }

    stringToTranslateId(str: string) {
        return str?.replace(/\s/g, '-').toLowerCase();
    }

    getInterpreteeName(interpreterId: string) {
        const interpreter = this.nonJudgeParticipants.find(x => x.id === interpreterId);
        if (!interpreter.linkedParticipants || interpreter.linkedParticipants.length === 0) {
            return null;
        }
        return this.nonJudgeParticipants.find(x => x.id === interpreter.linkedParticipants[0].linkedId).name;
    }

    protected filterNonJudgeParticipants(): void {
        let nonJudgeParts = this._conference.participants
            .filter(
                x =>
                    x.role !== Role.Judge &&
                    x.role !== Role.JudicialOfficeHolder &&
                    x.hearingRole !== HearingRole.OBSERVER &&
                    x.role !== Role.QuickLinkObserver &&
                    x.role !== Role.QuickLinkParticipant &&
                    x.hearingRole !== HearingRole.STAFF_MEMBER
            )
            .sort(SortingHelper.orderByRoleThenName);

        nonJudgeParts = [
            ...nonJudgeParts,
            ...this._conference.participants
                .filter(x => x.role === Role.QuickLinkParticipant)
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
        ];

        const interpreterList = nonJudgeParts.filter(
            x =>
                x.role === Role.Individual &&
                x.hearingRole === HearingRole.INTERPRETER &&
                Array.isArray(x.linkedParticipants) &&
                x.linkedParticipants.length > 0
        );
        if (!interpreterList) {
            this.nonJudgeParticipants = nonJudgeParts;
        } else {
            this.nonJudgeParticipants = this.orderForInterpreter(nonJudgeParts, interpreterList);
        }
    }

    protected filterObservers(): void {
        let observers = this._conference.participants
            .filter(x => x.hearingRole === HearingRole.OBSERVER && x.role !== Role.QuickLinkObserver)
            .sort((a, b) => a.displayName.localeCompare(b.displayName));

        observers = [
            ...observers,
            ...this._conference.participants
                .filter(x => x.role === Role.QuickLinkObserver)
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
        ];

        this.observers = observers;
    }

    protected filterPanelMembers(): void {
        this.panelMembers = this._conference.participants
            .filter(x => this.isParticipantPanelMember(x.hearingRole))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    protected isParticipantPanelMember(hearingRole: string): boolean {
        return HearingRoleHelper.isPanelMember(hearingRole);
    }

    protected filterJudge(): void {
        this.judge = this._conference.participants.find(x => x.role === Role.Judge);
    }

    protected filterStaffMember(): void {
        this.staffMembers = this._conference.participants
            .filter(x => x.role === Role.StaffMember)
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
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

    private orderForInterpreter(nonJudgeParticipants: VHParticipant[], interpreterList: VHParticipant[]): VHParticipant[] {
        const sortedNonJudgeParticipants = [...nonJudgeParticipants];

        interpreterList.forEach(interpreter => {
            const linkDetails = interpreter.linkedParticipants[0];
            const interpretee = nonJudgeParticipants.find(x => x.id === linkDetails.linkedId);

            const interpreterIndex = sortedNonJudgeParticipants.findIndex(x => x.id === interpreter.id);
            const interpreteeIndex = sortedNonJudgeParticipants.findIndex(x => x.id === interpretee.id);

            if (interpreterIndex !== interpreteeIndex + 1) {
                const interpreterToMove = sortedNonJudgeParticipants[interpreterIndex];

                sortedNonJudgeParticipants.splice(interpreterIndex, 1);
                const newInterpreteeIndex = sortedNonJudgeParticipants.findIndex(x => x.id === interpretee.id); // get interpretee index again as it would have shifted
                sortedNonJudgeParticipants.splice(newInterpreteeIndex + 1, 0, interpreterToMove);
            }
        });

        return sortedNonJudgeParticipants;
    }

    private filterWingers(): void {
        this.wingers = this._conference.participants
            .filter(x => x.hearingRole === HearingRole.WINGER)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    private sortEndpoints(): void {
        this.endpoints = [...this._conference.endpoints].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
}
