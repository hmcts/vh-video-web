import {
    ConferenceStatus,
    EndpointStatus,
    InterpreterType,
    LinkType,
    ParticipantStatus,
    Role,
    Supplier
} from 'src/app/services/clients/api-client';

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
    supplier: Supplier;
    countdownComplete?: boolean;
    audioRecordingIngestUrl: string;
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
    representee?: string;
    pexipInfo?: VHPexipParticipant;
    room?: VHRoom;
    interpreterLanguage?: VHInterpreterLanguage;
    currentAudioMix?: string;
    linkedParticipants: Array<VHLinkedParticipant>;
    externalReferenceId?: string;
    protectedFrom?: string[];
}

export interface VHEndpoint {
    id?: string;
    displayName: string | undefined;
    status: EndpointStatus;
    defenceAdvocate: string | undefined;
    room: VHRoom;
    pexipInfo?: VHPexipParticipant;
    interpreterLanguage?: VHInterpreterLanguage;
    externalReferenceId?: string;
    protectedFrom?: string[];
}

export interface VHPexipParticipant {
    isRemoteMuted: boolean;
    isSpotlighted: boolean;
    handRaised: boolean;
    pexipDisplayName: string;
    uuid: string;
    callTag: string;
    isAudioOnlyCall: boolean;
    isVideoCall: boolean;
    protocol: string;
    receivingAudioMix: string;
    sentAudioMixes: Array<PexipAudioMix>;
    role: string;
}

export interface VHPexipConference {
    guestsMuted: boolean;
    locked: boolean;
    started: boolean;
}

export interface VHRoom {
    label: string;
    locked: boolean;
}

export interface VHLinkedParticipant {
    linkedId?: string;
    linkedType?: LinkType;
}

export interface VHInterpreterLanguage {
    code: string;
    description: string;
    type: InterpreterType;
}
