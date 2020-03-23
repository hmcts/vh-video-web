import { Injectable } from '@angular/core';
import {
    ApiClient,
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
    ConferenceForVhOfficerResponse,
    ParticipantHeartbeatResponse
} from '../clients/api-client';
import { Observable } from 'rxjs';
import { IVideoWebApiService } from './video-web-service.interface';

@Injectable({
    providedIn: 'root'
})
export class VideoWebService implements IVideoWebApiService {
    constructor(private apiClient: ApiClient) {}

    getConferencesForJudge(): Observable<ConferenceForUserResponse[]> {
        return this.apiClient.getConferencesForJudge();
    }

    getConferencesForIndividual(): Observable<ConferenceForUserResponse[]> {
        return this.apiClient.getConferencesForIndividual();
    }

    getConferencesForVHOfficer(): Observable<ConferenceForVhOfficerResponse[]> {
        return this.apiClient.getConferencesForVhOfficer();
    }

    getConferenceById(conferenceId: string): Promise<ConferenceResponse> {
        return this.apiClient.getConferenceById(conferenceId).toPromise();
    }

    sendEvent(request: ConferenceEventRequest): Promise<void> {
        return this.apiClient.sendEvent(request).toPromise();
    }

    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void> {
        return this.apiClient.addMediaEventToConference(conferenceId, addMediaEventRequest).toPromise();
    }

    getTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        return this.apiClient.getTasks(conferenceId).toPromise();
    }

    completeTask(conferenceId: string, taskId: number): Promise<TaskResponse> {
        return this.apiClient.completeTask(conferenceId, taskId).toPromise();
    }

    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse> {
        return this.apiClient.getTestCallResult(conferenceId, participantId).toPromise();
    }

    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse> {
        return this.apiClient.getIndependentTestCallResult(participantId).toPromise();
    }

    getToken(participantId: string): Promise<TokenResponse> {
        return this.apiClient.getToken(participantId).toPromise();
    }

    getJwToken(participantId: string): Promise<TokenResponse> {
        return this.apiClient.getJwtoken(participantId).toPromise();
    }

    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void> {
        return this.apiClient.updateParticipantStatus(conferenceId, updateParticipantStatusEventRequest).toPromise();
    }

    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void> {
        return this.apiClient.addSelfTestFailureEventToConference(conferenceId, addSelfTestFailureEventRequest).toPromise();
    }

    getPexipConfig(): Promise<SelfTestPexipResponse> {
        return this.apiClient.getPexipConfig().toPromise();
    }

    getObfuscatedName(displayName: string): string {
        return displayName.replace(/(?!\b)\w/g, '*');
    }

    getHearingsVenue(): Promise<HearingVenueResponse[]> {
        return this.apiClient.getHearingsVenues().toPromise();
    }

    getConferenceChatHistory(conferenceId: string): Promise<ChatResponse[]> {
        return this.apiClient.getConferenceInstantMessageHistory(conferenceId).toPromise();
    }

    getParticipantHeartbeats(conferenceId: string, participantId: string): Promise<ParticipantHeartbeatResponse[]> {
        return this.apiClient.getHeartbeatDataForParticipant(conferenceId, participantId).toPromise();
    }
}
