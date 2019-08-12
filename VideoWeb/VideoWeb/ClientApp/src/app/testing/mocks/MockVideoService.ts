import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForUserResponse, ConferenceResponse, TaskResponse, AddMediaEventRequest,
    UpdateParticipantStatusEventRequest,
    AddSelfTestFailureEventRequest,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from './data/conference-test-data';
import { TasksTestData } from './data/tasks-test-data';

export class MockVideoWebService extends VideoWebService {

    getConferencesForJudge(): Observable<ConferenceForUserResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferencesForIndividual(): Observable<ConferenceForUserResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferenceById(conferenceId: string): Observable<ConferenceResponse> {
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

    raiseParticipantEvent(conferenceId: string,
        updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Observable<void> {
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
}
