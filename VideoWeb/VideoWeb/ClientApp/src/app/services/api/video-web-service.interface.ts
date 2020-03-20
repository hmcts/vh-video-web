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
    getConferenceById(conferenceId: string): Promise<ConferenceResponse>;
    sendEvent(request: ConferenceEventRequest): Promise<void>;
    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void>;
    getTasksForConference(conferenceId: string): Promise<TaskResponse[]>;
    completeTask(conferenceId: string, taskId: number): Promise<TaskResponse>;
    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse>;
    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse>;
    getToken(participantId: string): Promise<TokenResponse>;
    getJwToken(participantId: string): Promise<TokenResponse>;
    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void>;
    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void>;
    getPexipConfig(): Promise<SelfTestPexipResponse>;
    getObfuscatedName(displayName: string): string;
    getHearingsVenue(): Promise<HearingVenueResponse[]>;
    getConferenceChatHistory(conferenceId: string): Promise<ChatResponse[]>;
}
