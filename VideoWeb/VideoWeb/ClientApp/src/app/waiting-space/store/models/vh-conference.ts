import { ConferenceStatus, EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';

export interface VHConference {
    id: string;
    scheduledDateTime: Date;
    duration: number;
    caseNumber: string;
    caseName: string;
    status: ConferenceStatus;
    participants: Array<VHParticipant>;
    endpoints: Array<VHEndpoint>;
}

export interface VHParticipant {
    id: string;
    name: string;
    username: string;
    status: ParticipantStatus;
    tiledDisplayName: string;
    pexipInfo?: VHPexipParticipant;
    room?: VHRoom;
}

export interface VHEndpoint {
    id?: string;
    displayName: string | undefined;
    status: EndpointStatus;
    defence_advocate: string | undefined;
    room: VHRoom;
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
    id?: string;
    label: string;
    locked: boolean;
}
