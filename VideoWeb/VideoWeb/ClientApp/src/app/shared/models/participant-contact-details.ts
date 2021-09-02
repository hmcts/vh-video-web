import { ParticipantStatus, Role, ParticipantContactDetailsResponseVho } from 'src/app/services/clients/api-client';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class ParticipantContactDetails {
    private participant: ParticipantContactDetailsResponseVho;
    private participantStatusText: string;
    private isJudgeInAnotherHearing: boolean;

    constructor(participant: ParticipantContactDetailsResponseVho) {
        this.participant = participant;
        this.isJudgeInAnotherHearing = participant.judge_in_another_hearing;
    }

    get id(): string {
        return this.participant.id;
    }

    get refId(): string {
        return this.participant.ref_id;
    }

    get name() {
        return this.participant.name;
    }

    get caseGroup() {
        return this.participant.case_type_group;
    }

    get contactEmail() {
        return this.participant.contact_email;
    }

    get username() {
        return this.participant.username;
    }

    get contactTelephone() {
        return this.participant.contact_telephone;
    }

    get initialedName(): string {
        const initial = this.participant.first_name ? this.participant.first_name.substr(0, 1) : '';
        const name = this.participant.last_name || '';
        return `${initial} ${name}`;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    set status(value: ParticipantStatus) {
        this.participant.status = value;
    }

    get statusText(): string {
        return this.participantStatusText;
    }

    set statusText(value: string) {
        this.participantStatusText = value;
    }

    get role(): Role {
        return this.participant.role;
    }

    get hearingRole(): string {
        return this.participant.representee
            ? `${this.participant.hearing_role} for ${this.participant.representee}`
            : `${this.participant.hearing_role}`;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get isQuickLinkUser(): boolean {
        return this.participant.role === Role.QuickLinkParticipant || this.participant.role === Role.QuickLinkObserver;
    }

    get displayName(): string {
        return this.participant.display_name;
    }

    get hearingVenueName(): string {
        return this.participant.hearing_venue_name;
    }

    get judgeInAnotherHearing(): boolean {
        return this.isJudgeInAnotherHearing;
    }

    set judgeInAnotherHearing(value: boolean) {
        this.isJudgeInAnotherHearing = value;
    }

    get showCaseRole(): boolean {
        if (!this.participant.case_type_group) {
            return false;
        }

        return this.participant.case_type_group.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            this.participant.case_type_group.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            this.participant.case_type_group.toLowerCase() === CaseTypeGroup.PANEL_MEMBER.toLowerCase() ||
            this.participant.case_type_group.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            this.participant.case_type_group.toLowerCase() === CaseTypeGroup.STAFF_MEMBER.toLowerCase()
            ? false
            : true;
    }

    get isInterpreterOrInterpretee(): boolean {
        return this.participant.hearing_role === HearingRole.INTERPRETER || this.participant.linked_participants.length > 0;
    }
}
