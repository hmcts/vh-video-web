import { Directive, Input, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    EndpointStatus,
    LinkType,
    LoggedParticipantResponse,
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
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VHConference, VHEndpoint, VHParticipant } from '../store/models/vh-conference';

@Directive()
export abstract class WRParticipantStatusListDirective implements OnChanges {
    @Input() participantEndpoints: AllowedEndpointResponse[];

    vhConference: VHConference;
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

    // private _conference: ConferenceResponse;
    protected onDestroy$ = new Subject<void>();

    protected constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected videoWebService: VideoWebService,
        protected logger: Logger,
        protected translateService: TranslateService,
        protected focusService: FocusService,
        protected store: Store<ConferenceState>
    ) {}

    get canInvite(): boolean {
        const isJudicialUser = this.loggedInUser.role === Role.Judge || this.loggedInUser.role === Role.JudicialOfficeHolder;
        const isStaffMember = this.loggedInUser.role === Role.StaffMember;

        if (isJudicialUser || isStaffMember) {
            return true;
        } else {
            const loggedInParticipant = this.vhConference.participants.find(x => x.id === this.loggedInUser.participant_id);
            const hasLinkedParticipants = loggedInParticipant.linkedParticipants.length;
            const currentRoomIsJudicial = loggedInParticipant.room?.label.startsWith('JudgeJOH');

            return !currentRoomIsJudicial && !hasLinkedParticipants;
        }
    }

    // get conference(): ConferenceResponse {
    //     return this._conference;
    // }

    get participantCount(): number {
        return (
            this.nonJudgeParticipants.length +
            this.observers.length +
            this.panelMembers.length +
            this.wingers.length +
            this.staffMembers.length
        );
    }

    @Input() set conference(conference: ConferenceResponse) {
        // this._conference = conference;
        // this.initParticipants();
    }

    ngOnChanges() {
        if (!this.vhConference) {
            return;
        }
        this.initParticipants();
        this.displayParticipantList = this.participantCount > 0;
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

    isCaseTypeNone(participant: VHParticipant): boolean {
        return !participant.caseTypeGroup || participant.caseTypeGroup === 'None';
    }

    executeTeardown(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
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
        this.focusService.restoreFocus();
    }

    isParticipantAvailable(participant: VHParticipant): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    isEndpointAvailable(endpoint: VideoEndpointResponse): boolean {
        return endpoint.status === EndpointStatus.Connected;
    }

    isWitness(participant: VHParticipant): boolean {
        return participant.hearingRole === HearingRole.WITNESS;
    }

    hasInterpreterLink(participant: VHParticipant) {
        return participant?.linkedParticipants.some(x => x.linkedType === LinkType.Interpreter);
    }

    getHearingRole(participant: VHParticipant) {
        const translatedHearingRole = this.translateService.instant('hearing-role.' + this.stringToTranslateId(participant.hearingRole));
        const translatedFor = this.translateService.instant('wr-participant-list-shared.for');
        if (participant.hearingRole === HearingRole.INTERPRETER) {
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
        return this.nonJudgeParticipants.find(x => x.id === interpreter.linkedParticipants[0].linkedId).name;
    }

    protected filterNonJudgeParticipants(): void {
        let nonJudgeParts = this.vhConference.participants
            .filter(
                x =>
                    x.role !== Role.Judge &&
                    x.role !== Role.JudicialOfficeHolder &&
                    x.caseTypeGroup !== CaseTypeGroup.OBSERVER &&
                    x.hearingRole !== HearingRole.OBSERVER &&
                    x.role !== Role.QuickLinkObserver &&
                    x.role !== Role.QuickLinkParticipant &&
                    x.hearingRole !== HearingRole.STAFF_MEMBER
            )
            .sort(
                (a, b) => a.caseTypeGroup.localeCompare(b.caseTypeGroup) || (a.name || a.displayName).localeCompare(b.name || b.displayName)
            );

        nonJudgeParts = [
            ...nonJudgeParts,
            ...this.vhConference.participants
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
        let observers = this.vhConference.participants
            .filter(
                x =>
                    x.caseTypeGroup === CaseTypeGroup.OBSERVER ||
                    (x.hearingRole === HearingRole.OBSERVER && x.role !== Role.QuickLinkObserver)
            )
            .sort((a, b) => a.displayName.localeCompare(b.displayName));

        observers = [
            ...observers,
            ...this.vhConference.participants
                .filter(x => x.role === Role.QuickLinkObserver)
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
        ];

        this.observers = observers;
    }

    protected filterPanelMembers(): void {
        this.panelMembers = this.vhConference.participants
            .filter(x => this.isParticipantPanelMember(x.hearingRole))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    protected isParticipantPanelMember(hearingRole: string): boolean {
        return HearingRoleHelper.isPanelMember(hearingRole);
    }

    protected filterJudge(): void {
        this.judge = this.vhConference.participants.find(x => x.role === Role.Judge);
    }

    protected filterStaffMember(): void {
        this.staffMembers = this.vhConference.participants
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
        this.wingers = this.vhConference.participants
            .filter(x => x.hearingRole === HearingRole.WINGER)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    private sortEndpoints(): void {
        this.endpoints = [...this.vhConference.endpoints].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
}
