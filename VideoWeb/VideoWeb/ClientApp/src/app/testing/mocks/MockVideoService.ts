import { IVideoWebApiService } from 'src/app/services/api/video-web-service.interface';
import {
    ConferenceForUserResponse,
    ConferenceResponse,
    TaskResponse,
    AddMediaEventRequest,
    UpdateParticipantStatusEventRequest,
    AddSelfTestFailureEventRequest,
    TokenResponse,
    ChatResponse,
    TestCallScoreResponse,
    ConferenceEventRequest,
    ConferenceForVhOfficerResponse
} from 'src/app/services/clients/api-client';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from './data/conference-test-data';
import { TasksTestData } from './data/tasks-test-data';

export class MockVideoWebService implements IVideoWebApiService {
    getConferencesForVHOfficer(): Observable<ConferenceForVhOfficerResponse[]> {
        throw new Error('Method not implemented.');
    }
    sendEvent(request: ConferenceEventRequest): Observable<void> {
        throw new Error('Method not implemented.');
    }
    getTasksForConference(conferenceId: string): Observable<TaskResponse[]> {
        throw new Error('Method not implemented.');
    }
    getTestCallScore(conferenceId: string, participantId: string): Observable<TestCallScoreResponse> {
        throw new Error('Method not implemented.');
    }
    getIndependentTestCallScore(participantId: string): Observable<TestCallScoreResponse> {
        throw new Error('Method not implemented.');
    }
    getJwToken(participantId: string): Observable<TokenResponse> {
        throw new Error('Method not implemented.');
    }
    getPexipConfig(): Observable<import('../../services/clients/api-client').SelfTestPexipResponse> {
        throw new Error('Method not implemented.');
    }
    getObfuscatedName(displayName: string): string {
        return displayName.replace(/(?!\b)\w/g, '*');
    }
    getHearingsVenue(): Observable<import('../../services/clients/api-client').HearingVenueResponse[]> {
        throw new Error('Method not implemented.');
    }
    getConferencesForJudge(): Observable<ConferenceForUserResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferencesForIndividual(): Observable<ConferenceForUserResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferenceById(conferenceId: string): Observable<ConferenceResponse> {
        console.log(`using mock video web service: getConferenceById ${JSON.stringify(conferenceId)}`);
        return of(new ConferenceTestData().getConferenceDetail());
    }

    completeTask(conferenceId: string, taskId: number): Observable<TaskResponse> {
        console.log('using mock video web service: completeTask');
        return of(new TasksTestData().getCompletedTask());
    }

    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Observable<void> {
        console.log('using mock raise event');
        return of();
    }

    raiseParticipantEvent(
        conferenceId: string,
        updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest
    ): Observable<void> {
        console.log('using mock raise event for participant status');
        return of();
    }

    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Observable<void> {
        console.log('using mock raise participant self test failed event');
        return of();
    }

    getToken(participantId: string): Observable<TokenResponse> {
        console.log('using mock get token');
        const token = new TokenResponse({
            expires_on: new Date().toDateString(),
            token: participantId
        });
        return of(token);
    }

    getConferenceChatHistory(conferenceId: string): Observable<ChatResponse[]> {
        return of(new ConferenceTestData().getChatHistory(null, conferenceId));
    }
}
