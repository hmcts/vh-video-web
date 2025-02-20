import { ParticipantContactDetailsResponseVho, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class ParticipantContactDetails {
    private participant: ParticipantContactDetailsResponseVho;
    private participantStatusText: string;
    private isHostInAnotherHearing: boolean;

    constructor(participant: ParticipantContactDetailsResponseVho) {
        this.participant = participant;
        this.isHostInAnotherHearing = participant.host_in_another_hearing;
    }

    get id(): string {
        return this.participant.id;
    }

    get refId(): string {
        return this.participant.ref_id;
    }

    get name() {
        return this.participant.name ?? this.participant.first_name + ' ' + this.participant.last_name;
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

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get statusText(): string {
        return this.participantStatusText;
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

    get isStaffMember(): boolean {
        return this.participant.role === Role.StaffMember;
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

    get hostInAnotherHearing(): boolean {
        return this.isHostInAnotherHearing;
    }

    get isInterpreterOrInterpretee(): boolean {
        return this.participant.hearing_role === HearingRole.INTERPRETER || this.participant.linked_participants.length > 0;
    }

    set status(value: ParticipantStatus) {
        this.participant.status = value;
    }

    set statusText(value: string) {
        this.participantStatusText = value;
    }

    set hostInAnotherHearing(value: boolean) {
        this.isHostInAnotherHearing = value;
    }
}
