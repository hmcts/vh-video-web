import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    ParticipantResponseVho,
    ParticipantForUserResponse,
    LinkedParticipantResponse,
    RoomSummaryResponse,
    VideoEndpointResponse
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
    currentRoom: RoomSummaryResponse;
}

export interface IParticipantDetails {
    id: string;
    name: string;
    displayName: string;
    pexipDisplayName: string;
    caseGroup: CaseTypeGroup;
    role: Role;
    hearingRole: HearingRole;
    status: ParticipantStatus;
    isEndPoint: boolean;
    virtualMeetingRoomSummary: RoomSummaryResponse;
    linkedParticipants: LinkedParticipantResponse[];
}

export interface IEndpointDetails {}

export class ParticipantModel implements IParticipantDetails, IParticipantConferenceState, IParticipantHearingState {
    constructor(
        public id: string,
        public name: string,
        public displayName: string,
        public pexipDisplayName: string,
        public caseGroup: CaseTypeGroup,
        public role: Role,
        public hearingRole: HearingRole,
        public isEndPoint: boolean,
        public virtualMeetingRoomSummary: RoomSummaryResponse,
        public linkedParticipants: LinkedParticipantResponse[],
        public status: ParticipantStatus = ParticipantStatus.None,
        public currentRoom: RoomSummaryResponse = null,
        public pexipId: string = null,
        public isSpotlighted: boolean = false,
        public isRemoteMuted: boolean = false,
        public isHandRaised: boolean = false
    ) {}

    private static fromAParticipantResponseType(participant: ParticipantResponse | ParticipantForUserResponse | ParticipantResponseVho) {
        return new ParticipantModel(
            participant.id,
            participant.name,
            participant.display_name,
            participant.tiled_display_name, // = pexip_display_name
            CaseTypeGroup[participant.case_type_group],
            participant.role,
            HearingRole[participant.hearing_role],
            false,
            participant.interpreter_room,
            participant.linked_participants,
            participant.status,
            participant.current_room
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

    static fromVideoEndpointResponse(videoEndpointResponse: VideoEndpointResponse): any {
        return new ParticipantModel(
            videoEndpointResponse.id,
            videoEndpointResponse.defence_advocate_username,
            videoEndpointResponse.display_name,
            videoEndpointResponse.pexip_display_name, // = tiled_display_name
            null,
            null,
            null,
            true,
            null,
            null,
            ParticipantStatus[videoEndpointResponse.status], // Will be undefined when not joining...
            videoEndpointResponse.current_room
        );
    }
}

export class Participant {
    private participant: ParticipantResponse | ParticipantResponseVho | ParticipantForUserResponse;

    constructor(participant: ParticipantResponse | ParticipantResponseVho | ParticipantForUserResponse) {
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
