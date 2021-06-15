import { Guid } from 'guid-typescript';
import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    ParticipantResponseVho,
    ParticipantForUserResponse,
    LinkedParticipantResponse,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export interface IParticipantHearingState {
    id: string;
    pexipId: string;
    isSpotlighted: boolean;
    isRemoteMuted: boolean;
    isHandRaised: boolean;
}

export interface IParticipantConferenceState {
    id: string;
    status: ParticipantStatus;
    currentRoom: RoomSummaryResponse;
}

export interface IParticipantDetails {
    id: string;
    name: string;
    displayName: string;
    caseGroup: CaseTypeGroup;
    role: Role;
    hearingRole: HearingRole;
    isEndPoint: boolean;
    linkedParticipants: LinkedParticipantResponse[];
}

export class ParticipantModel implements IParticipantDetails, IParticipantConferenceState, IParticipantHearingState {
    constructor(
        public id: string,
        public name: string,
        public displayName: string,
        public caseGroup: CaseTypeGroup,
        public role: Role,
        public hearingRole: HearingRole,
        public isEndPoint: boolean,
        public linkedParticipants: LinkedParticipantResponse[],
        public status: ParticipantStatus = ParticipantStatus.None,
        public currentRoom: RoomSummaryResponse = null,
        public pexipId: string = Guid.EMPTY,
        public isSpotlighted: boolean = false,
        public isRemoteMuted: boolean = false,
        public isHandRaised: boolean = false
    ) {}

    private static fromAParticipantResponseType(participant: ParticipantResponse | ParticipantForUserResponse | ParticipantResponseVho) {
        return new ParticipantModel(
            participant.id,
            participant.name,
            participant.display_name,
            CaseTypeGroup[participant.case_type_group],
            participant.role,
            HearingRole[participant.hearing_role],
            false,
            participant.linked_participants,
            participant.status
        );
    }

    static fromParticipantResponse(participant: ParticipantResponse) {
        return this.fromAParticipantResponseType(participant);
    }

    static fromParticipantForUserResponse(participant: ParticipantForUserResponse) {
        return this.fromAParticipantResponseType(participant);
    }

    static fromParticipantResponseVho(participant: ParticipantResponseVho) {
        return this.fromAParticipantResponseType(participant);
    }
}

export class Participant {
    private participant: ParticipantResponse | ParticipantForUserResponse | ParticipantForUserResponse;

    constructor(participant: ParticipantResponse | ParticipantForUserResponse | ParticipantForUserResponse) {
        this.participant = participant;
    }

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
