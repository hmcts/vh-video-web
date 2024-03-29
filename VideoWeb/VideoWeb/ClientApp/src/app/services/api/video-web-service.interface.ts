import { Observable } from 'rxjs';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForIndividualResponse,
    ConferenceForHostResponse,
    ConferenceResponse,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TokenResponse,
    UpdateParticipantDisplayNameRequest,
    UpdateParticipantStatusEventRequest,
    HearingVenueResponse,
    ParticipantForUserResponse,
    VideoEndpointResponse
} from '../clients/api-client';
export interface IVideoWebApiService {
    getConferencesForJudge(): Observable<ConferenceForHostResponse[]>;
    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]>;
    getConferenceById(conferenceId: string): Promise<ConferenceResponse>;
    sendEvent(request: ConferenceEventRequest): Promise<void>;
    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void>;
    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse>;
    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse>;
    getSelfTestToken(participantId: string): Promise<TokenResponse>;
    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void>;
    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void>;
    getPexipConfig(): Promise<SelfTestPexipResponse>;
    getObfuscatedName(displayName: string): string;
    getConferenceChatHistory(conferenceId: string, participantId: string): Promise<ChatResponse[]>;
    updateParticipantDisplayName(
        conferenceId: string,
        participantId: string,
        updateParticipantRequest: UpdateParticipantDisplayNameRequest
    );
    getVenues(): Observable<HearingVenueResponse[]>;
    getParticipantsByConferenceId(conferenceId: string): Promise<ParticipantForUserResponse[]>;
    getEndpointsForConference(conferenceId: string): Promise<VideoEndpointResponse[]>;
}
