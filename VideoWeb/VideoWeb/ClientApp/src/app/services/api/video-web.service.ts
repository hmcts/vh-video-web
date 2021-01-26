import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ApiClient,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForIndividualResponse,
    ConferenceForJudgeResponse,
    ConferenceResponse,
    ParticipantContactDetailsResponseVho,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TokenResponse,
    UnreadAdminMessageResponse,
    UpdateParticipantRequest,
    UpdateParticipantStatusEventRequest,
    UnreadInstantMessageConferenceCountResponse,
    JudgeNameListResponse,
    ParticipantForUserResponse,
    VideoEndpointResponse,
    CurrentUserOrParticipantResponse
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

    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]> {
        return this.apiClient.getConferencesForIndividual();
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

    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse> {
        return this.apiClient.getTestCallResult(conferenceId, participantId).toPromise();
    }

    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse> {
        return this.apiClient.getIndependentTestCallResult(participantId).toPromise();
    }

    getSelfTestToken(participantId: string): Promise<TokenResponse> {
        return this.apiClient.getSelfTestToken(participantId).toPromise();
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

    getDistinctJudgeNames(): Promise<JudgeNameListResponse> {
        return this.apiClient.getDistinctJudgeNames().toPromise();
    }

    /**
     * Get the chat history where sender/reciver is from/to given username in a conference
     * @param conferenceId conference Id
     * @param participantId participant's Id to filter chat history
     */
    getConferenceChatHistory(conferenceId: string, participantId: string): Promise<ChatResponse[]> {
        return this.apiClient.getConferenceInstantMessageHistoryForParticipant(conferenceId, participantId).toPromise();
    }

    /**
     * Get a total of unread messages betwen admin and all partcipants in a conference
     * @param conferenceId conference id
     */
    getUnreadMessageCountForConference(conferenceId: string): Promise<UnreadInstantMessageConferenceCountResponse> {
        return this.apiClient.getNumberOfUnreadAdminMessagesForConference(conferenceId).toPromise();
    }

    /**
     * Get the total of unread message between an admin and given username
     * @param conferenceId conference id
     * @param participantId participant's Id to filter chat history
     */
    getUnreadMessagesForParticipant(conferenceId: string, participantId: string): Promise<UnreadAdminMessageResponse> {
        return this.apiClient.getNumberOfUnreadAdminMessagesForConferenceByParticipant(conferenceId, participantId).toPromise();
    }

    setActiveIndividualConference(conference: ConferenceForIndividualResponse) {
        const conf = new ConferenceLite(conference.id, conference.case_number);
        this.activeConferencesCache.clear();
        this.activeConferencesCache.set(conf);
    }

    getActiveIndividualConference(): ConferenceLite {
        return this.activeConferencesCache.get();
    }

    getParticipantsWithContactDetailsByConferenceId(conferenceId: string): Promise<ParticipantContactDetailsResponseVho[]> {
        return this.apiClient.getParticipantsWithContactDetailsByConferenceId(conferenceId).toPromise();
    }

    updateParticipantDetails(
        conferenceId: string,
        participantId: string,
        updateParticipantRequest: UpdateParticipantRequest
    ): Promise<void> {
        return this.apiClient.updateParticipantDisplayName(conferenceId, participantId, updateParticipantRequest).toPromise();
    }

    getParticipantsByConferenceId(conferenceId: string): Promise<ParticipantForUserResponse[]> {
        return this.apiClient.getParticipantsByConferenceId(conferenceId).toPromise();
    }

    getEndpointsForConference(conferenceId: string): Promise<VideoEndpointResponse[]> {
        return this.apiClient.getVideoEndpointsForConference(conferenceId).toPromise();
    }

    getCurrentParticipant(conferenceId: string): Promise<CurrentUserOrParticipantResponse> {
        return this.apiClient.getCurrentParticipant(conferenceId).toPromise();
    }
}
