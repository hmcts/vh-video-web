import { ConferenceStatus, EndpointStatus, LinkType, ParticipantStatus, Role } from 'src/app/services/clients/api-client';

export interface VHConference {
    id: string;
    scheduledDateTime: Date;
    endDateTime?: Date;
    duration: number;
    caseNumber: string;
    caseName: string;
    status: ConferenceStatus;
    isVenueScottish: boolean;
    participants: Array<VHParticipant>;
    endpoints: Array<VHEndpoint>;
}

export interface VHParticipant {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    username: string;
    status: ParticipantStatus;
    displayName: string;
    tiledDisplayName: string;
    role: Role;
    hearingRole: string;
    caseTypeGroup: string;
    representee?: string;
    pexipInfo?: VHPexipParticipant;
    room?: VHRoom;
    linkedParticipants: Array<VHLinkedParticipant>;
}

export interface VHEndpoint {
    id?: string;
    displayName: string | undefined;
    status: EndpointStatus;
    defenceAdvocate: string | undefined;
    room: VHRoom;
    pexipInfo?: VHPexipParticipant;
}

export interface VHPexipParticipant {
    isRemoteMuted: boolean;
    isSpotlighted: boolean;
    handRaised: boolean;
    pexipDisplayName: string;
    uuid: string;
    isAudioOnlyCall: boolean;
    isVideoCall: boolean;
    protocol: string;
}

export interface VHRoom {
    label: string;
    locked: boolean;
}

export interface VHLinkedParticipant {
    linkedId?: string;
    linkedType?: LinkType;
}
