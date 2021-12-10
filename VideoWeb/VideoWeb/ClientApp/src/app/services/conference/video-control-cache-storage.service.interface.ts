import { Observable } from 'rxjs';

export interface IHearingControlsState {
    participantStates: { [participantId: string]: IParticipantControlsState };
}

export interface IParticipantControlsState {
    isSpotlighted?: boolean;
    isLocalAudioMuted?: boolean;
    isLocalVideoMuted?: boolean;
}

export interface IHearingControlStates {
    [conferenceId: string]: IHearingControlsState;
}

export interface IVideoControlCacheStorageService {
    saveHearingStateForConference(currentConferenceId: string, hearingControlStates: IHearingControlsState): Observable<void>;
    loadHearingStateForConference(id: string): Observable<IHearingControlsState>;
}
