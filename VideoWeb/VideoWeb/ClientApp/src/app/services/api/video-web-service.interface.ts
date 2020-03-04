import {
    ConferenceForUserResponse,
    ConferenceResponse,
    ConferenceEventRequest,
    TaskResponse,
    AddMediaEventRequest,
    TestCallScoreResponse,
    TokenResponse,
    AddSelfTestFailureEventRequest,
    UpdateParticipantStatusEventRequest,
    SelfTestPexipResponse,
    HearingVenueResponse,
    ChatResponse,
    ConferenceForVhOfficerResponse
} from '../clients/api-client';
import { Observable } from 'rxjs';
export interface IVideoWebApiService {
    getConferencesForJudge(): Observable<ConferenceForUserResponse[]>;
    getConferencesForIndividual(): Observable<ConferenceForUserResponse[]>;
    getConferencesForVHOfficer(): Observable<ConferenceForVhOfficerResponse[]>;
    getConferenceById(conferenceId: string): Observable<ConferenceResponse>;
    sendEvent(request: ConferenceEventRequest): Observable<void>;
    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Observable<void>;
    getTasksForConference(conferenceId: string): Observable<TaskResponse[]>;
    completeTask(conferenceId: string, taskId: number): Observable<TaskResponse>;
    getTestCallScore(conferenceId: string, participantId: string): Observable<TestCallScoreResponse>;
    getIndependentTestCallScore(participantId: string): Observable<TestCallScoreResponse>;
    getToken(participantId: string): Observable<TokenResponse>;
    getJwToken(participantId: string): Observable<TokenResponse>;
    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Observable<void>;
    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Observable<void>;
    getPexipConfig(): Observable<SelfTestPexipResponse>;
    getObfuscatedName(displayName: string): string;
    getHearingsVenue(): Observable<HearingVenueResponse[]>;
    getConferenceChatHistory(conferenceId: string): Observable<ChatResponse[]>;
}
