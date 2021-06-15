import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    ParticipantResponseVho,
    ParticipantForUserResponse,
    LinkedParticipantResponse
} from 'src/app/services/clients/api-client';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export interface IParticipantHearingState {
    isSpotlighted: boolean;
}

export interface IParticipantConferenceState {
    status: ParticipantStatus;
    linkedParticipants: LinkedParticipantResponse[];
}

export interface IParticipantDetails {
    id: string;
    name: string;
    displayName: string;
    caseGroup: CaseTypeGroup;
    role: Role;
    hearingRole: HearingRole;
}

export class Participant implements IParticipantHearingState {
    private participant: ParticipantResponse | ParticipantForUserResponse | ParticipantForUserResponse;

    constructor(participant: ParticipantResponse | ParticipantForUserResponse | ParticipantForUserResponse) {
        this.participant = participant;
    }

    isSpotlighted: boolean = false;

    get base(): ParticipantResponseVho {
        return this.participant;
    }

    get id(): string {
        return this.participant.id;
    }

    get fullName() {
        return this.participant.name;
    }

    get caseGroup() {
        return this.participant.case_type_group;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get role(): Role {
        return this.participant.role;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get displayName(): string {
        return this.participant.display_name;
    }

    get representee(): string {
        return this.participant.representee;
    }

    get hearingRoleText(): string {
        return this.representee ? `${this.base.hearing_role} for ${this.representee}` : this.base.hearing_role;
    }

    get isInterpreterOrInterpretee() {
        return (
            this.participant.hearing_role === HearingRole.INTERPRETER ||
            (this.participant.linked_participants && this.participant.linked_participants.length > 0)
        );
    }
}
