import { Observable } from 'rxjs';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForIndividualResponse,
    ConferenceForJudgeResponse,
    ConferenceResponse,
    HearingVenueResponse,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TokenResponse,
    UpdateParticipantRequest,
    UpdateParticipantStatusEventRequest
} from '../clients/api-client';
export interface IVideoWebApiService {
    getConferencesForJudge(): Observable<ConferenceForJudgeResponse[]>;
    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]>;
    getConferenceById(conferenceId: string): Promise<ConferenceResponse>;
    sendEvent(request: ConferenceEventRequest): Promise<void>;
    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void>;
    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse>;
    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse>;
    getSelfTestToken(participantId: string): Promise<TokenResponse>;
    getJwToken(participantId: string): Promise<TokenResponse>;
    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void>;
    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void>;
    getPexipConfig(): Promise<SelfTestPexipResponse>;
    getObfuscatedName(displayName: string): string;
    getHearingVenues(): Promise<HearingVenueResponse[]>;
    getConferenceChatHistory(conferenceId: string): Promise<ChatResponse[]>;
    updateParticipantDetails(conferenceId: string, participantId: string, updateParticipantRequest: UpdateParticipantRequest);
}
