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
import { PexipDisplayNameModel } from 'src/app/services/conference/models/pexip-display-name.model';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export interface IParticipantHearingState {
    id: string;
    pexipId: string | null;
    isSpotlighted: boolean;
    isRemoteMuted: boolean;
    isLocallyAudioMuted: boolean;
    isLocallyVideoMuted: boolean;
    isHandRaised: boolean;
}

export interface IParticipantConferenceState {
    id: string;
    currentRoom: RoomSummaryResponse | null;
}

export interface IParticipantDetails {
    id: string;
    name: string;
    displayName: string;
    pexipDisplayName: PexipDisplayNameModel;
    caseGroup: string;
    role: Role;
    hearingRole: string;
    status: ParticipantStatus;
    isEndPoint: boolean;
    virtualMeetingRoomSummary: RoomSummaryResponse;
    linkedParticipants: LinkedParticipantResponse[];
}

export class ParticipantModel implements IParticipantDetails, IParticipantConferenceState, IParticipantHearingState {
    public pexipDisplayName: PexipDisplayNameModel;

    constructor(
        public id: string,
        public name: string,
        public displayName: string,
        pexipDisplayName: string | PexipDisplayNameModel,
        public caseGroup: string,
        public role: Role,
        public hearingRole: string,
        public isEndPoint: boolean,
        public virtualMeetingRoomSummary: RoomSummaryResponse,
        public linkedParticipants: LinkedParticipantResponse[],
        public status: ParticipantStatus = ParticipantStatus.None,
        public currentRoom: RoomSummaryResponse | null = null,
        public pexipId: string | null = null,
        public isSpotlighted: boolean = false,
        public isRemoteMuted: boolean = false,
        public isLocallyAudioMuted: boolean = false,
        public isLocallyVideoMuted: boolean = false,
        public isHandRaised: boolean = false
    ) {
        if (typeof pexipDisplayName === 'string') {
            this.pexipDisplayName = PexipDisplayNameModel.fromString(pexipDisplayName);
        } else {
            this.pexipDisplayName = pexipDisplayName;
        }
    }

    private static fromAParticipantResponseType(participant: ParticipantResponse | ParticipantForUserResponse | ParticipantResponseVho) {
        return new ParticipantModel(
            participant.id,
            participant.name,
            participant.display_name,
            participant.tiled_display_name, // same as pexip_display_name
            participant.case_type_group,
            participant.role,
            participant.hearing_role,
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
            videoEndpointResponse.pexip_display_name, // same as tiled_display_name
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
    private participant: ParticipantResponseVho;

    constructor(participant: ParticipantResponseVho) {
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
