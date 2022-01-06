export interface IConferenceParticipantsStatus {
    [participantId: string]: IParticipatRemoteMuteStatus;
}

export interface IParticipatRemoteMuteStatus {
    isRemoteMuted?: boolean;
    isLocalAudioMuted?: boolean;
    isLocalVideoMuted?: boolean;
    pexipId?: string;
}
