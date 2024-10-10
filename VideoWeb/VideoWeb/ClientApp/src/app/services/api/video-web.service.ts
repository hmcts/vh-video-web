import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ApiClient,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForIndividualResponse,
    ConferenceForHostResponse,
    ConferenceResponse,
    ParticipantContactDetailsResponseVho,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TokenResponse,
    UnreadAdminMessageResponse,
    UpdateParticipantDisplayNameRequest,
    UpdateParticipantStatusEventRequest,
    UnreadInstantMessageConferenceCountResponse,
    ParticipantForUserResponse,
    VideoEndpointResponse,
    LoggedParticipantResponse,
    AllowedEndpointResponse,
    HearingVenueResponse,
    JusticeUserResponse
} from '../clients/api-client';
import { ConferenceLite } from '../models/conference-lite';
import { SessionStorage } from '../session-storage';
import { IVideoWebApiService } from './video-web-service.interface';
import { catchError, map } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { ConferenceActions } from 'src/app/waiting-space/store/actions/conference.actions';
import { mapConferenceToVHConference } from '../../waiting-space/store/models/api-contract-to-state-model-mappers';

@Injectable({
    providedIn: 'root'
})
export class VideoWebService implements IVideoWebApiService {
    readonly ACTIVE_CONFERENCE_KEY = 'vh.active.conference';
    private readonly activeConferencesCache: SessionStorage<ConferenceLite>;
    private readonly venueAllocationStorage: SessionStorage<string[]>;

    constructor(
        private apiClient: ApiClient,
        private store: Store<ConferenceState>
    ) {
        this.activeConferencesCache = new SessionStorage<ConferenceLite>(this.ACTIVE_CONFERENCE_KEY);
        this.venueAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    getConferencesForJudge(): Observable<ConferenceForHostResponse[]> {
        return this.apiClient.getConferencesForHost();
    }

    getConferencesForStaffMember(): Observable<ConferenceForHostResponse[]> {
        const venues = this.venueAllocationStorage.get();
        return this.apiClient.getConferencesForStaffMember(venues);
    }

    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]> {
        return this.apiClient.getConferencesForIndividual();
    }

    getConferenceById(conferenceId: string): Promise<ConferenceResponse> {
        return this.apiClient
            .getConferenceById(conferenceId)
            .toPromise()
            .then(conference => {
                this.store.dispatch(
                    ConferenceActions.loadConferenceSuccess({
                        conference: mapConferenceToVHConference(conference)
                    })
                );
                return conference;
            });
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

    checkUserHasCompletedSelfTest(): Observable<boolean> {
        return this.apiClient.checkUserCompletedATestToday().pipe(
            map(() => true),
            catchError(() => [false])
        );
    }

    getSelfTestToken(participantId: string): Promise<TokenResponse> {
        return this.apiClient.getSelfTestToken(participantId).toPromise();
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

    getVenues(): Observable<HearingVenueResponse[]> {
        return this.apiClient.getVenues();
    }

    getCSOs(): Observable<JusticeUserResponse[]> {
        return this.apiClient.getCSOs();
    }

    staffMemberJoinConference(conferenceId: string): Promise<ConferenceForHostResponse> {
        return this.apiClient.staffMemberJoinConference(conferenceId).toPromise();
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

    updateParticipantDisplayName(
        conferenceId: string,
        participantId: string,
        updateParticipantRequest: UpdateParticipantDisplayNameRequest
    ): Promise<void> {
        return this.apiClient.updateParticipantDisplayName(conferenceId, participantId, updateParticipantRequest).toPromise();
    }

    getParticipantsByConferenceId(conferenceId: string): Promise<ParticipantForUserResponse[]> {
        return this.apiClient.getParticipantsByConferenceId(conferenceId).toPromise();
    }

    getEndpointsForConference(conferenceId: string): Promise<VideoEndpointResponse[]> {
        return this.apiClient.getVideoEndpointsForConference(conferenceId).toPromise();
    }

    getAllowedEndpointsForConference(conferenceId: string): Promise<AllowedEndpointResponse[]> {
        return this.apiClient.allowedVideoCallEndpoints(conferenceId).toPromise();
    }

    getCurrentParticipant(conferenceId: string): Promise<LoggedParticipantResponse> {
        return this.apiClient.getCurrentParticipant(conferenceId).toPromise();
    }

    deleteParticipant(conferenceId: string, participantId: string): Promise<void> {
        return this.apiClient.deleteParticipantFromConference(conferenceId, participantId).toPromise();
    }
}
