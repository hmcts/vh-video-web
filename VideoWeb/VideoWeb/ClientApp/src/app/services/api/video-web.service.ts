import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ApiClient,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForJudgeResponse,
    ConferenceForParticipantResponse,
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    HearingVenueResponse,
    ParticipantHeartbeatResponse,
    SelfTestPexipResponse,
    TaskResponse,
    TestCallScoreResponse,
    TokenResponse,
    UpdateParticipantStatusEventRequest
} from '../clients/api-client';
import { ConferenceLite } from '../models/conference-lite';
import { SessionStorage } from '../session-storage';
import { IVideoWebApiService } from './video-web-service.interface';

@Injectable({
    providedIn: 'root'
})
export class VideoWebService implements IVideoWebApiService {
    readonly ACTIVE_CONFERENCE_KEY = 'vh.active.conference';
    private readonly activeConferencesCache: SessionStorage<ConferenceLite>;

    constructor(private apiClient: ApiClient) {
        this.activeConferencesCache = new SessionStorage<ConferenceLite>(this.ACTIVE_CONFERENCE_KEY);
    }

    getConferencesForJudge(): Observable<ConferenceForJudgeResponse[]> {
        return this.apiClient.getConferencesForJudge();
    }

    getConferencesForIndividual(): Observable<ConferenceForParticipantResponse[]> {
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

    setActiveIndividualConference(conference: ConferenceForParticipantResponse) {
        const conf = new ConferenceLite(
            conference.id,
            conference.case_number,
            conference.logged_in_participant_id,
            this.getObfuscatedName(conference.logged_in_participant_display_name)
        );
        this.activeConferencesCache.clear();
        this.activeConferencesCache.set(conf);
    }

    getActiveIndividualConference(): ConferenceLite {
        return this.activeConferencesCache.get();
    }
}
