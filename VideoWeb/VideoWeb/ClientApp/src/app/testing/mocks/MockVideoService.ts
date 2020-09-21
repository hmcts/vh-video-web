import { IVideoWebApiService } from 'src/app/services/api/video-web-service.interface';
import {
    ConferenceForIndividualResponse,
    ConferenceResponse,
    TaskResponse,
    AddMediaEventRequest,
    UpdateParticipantStatusEventRequest,
    AddSelfTestFailureEventRequest,
    TokenResponse,
    ChatResponse,
    TestCallScoreResponse,
    ConferenceEventRequest,
    ConferenceForVhOfficerResponse,
    SelfTestPexipResponse,
    ParticipantHeartbeatResponse,
    ConferenceForJudgeResponse,
    UpdateParticipantRequest,
    ConferenceResponseVho,
    JudgeNameListResponse,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from './data/conference-test-data';
import { TasksTestData } from './data/tasks-test-data';

export class MockVideoWebService implements IVideoWebApiService {
    username: string;
    getConferencesForVHOfficer(): Observable<ConferenceForVhOfficerResponse[]> {
        throw new Error('Method not implemented.');
    }
    sendEvent(request: ConferenceEventRequest): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        throw new Error('Method not implemented.');
    }
    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse> {
        throw new Error('Method not implemented.');
    }
    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse> {
        throw new Error('Method not implemented.');
    }
    getJwToken(participantId: string): Promise<TokenResponse> {
        throw new Error('Method not implemented.');
    }
    getPexipConfig(): Promise<SelfTestPexipResponse> {
        return Promise.resolve(
            new SelfTestPexipResponse({
                pexip_self_test_node: 'selftest.automated.test'
            })
        );
    }
    getObfuscatedName(displayName: string): string {
        return displayName.replace(/(?!\b)\w/g, '*');
    }
    getDistinctJudgeNames(): Promise<JudgeNameListResponse> {
        throw new Error('Method not implemented.');
    }
    getConferencesForJudge(): Observable<ConferenceForJudgeResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getEndpointsForConference(conferenceId: string): Promise<VideoEndpointResponse[]> {
        return Promise.resolve(new ConferenceTestData().getListOfEndpoints());
    }

    getConferenceById(conferenceId: string): Promise<ConferenceResponse> {
        console.log(`using mock video web service: getConferenceById ${JSON.stringify(conferenceId)}`);
        return Promise.resolve(new ConferenceTestData().getConferenceDetailFuture());
    }

    getConferenceByIdVHO(conferenceId: string): Promise<ConferenceResponseVho> {
        console.log(`using mock video web service: getConferenceById ${JSON.stringify(conferenceId)}`);
        return Promise.resolve(new ConferenceTestData().getConferenceDetailFuture());
    }

    completeTask(conferenceId: string, taskId: number): Promise<TaskResponse> {
        console.log('using mock video web service: completeTask');
        return Promise.resolve(new TasksTestData().getCompletedTask());
    }

    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void> {
        console.log('using mock raise event');
        return Promise.resolve();
    }

    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void> {
        console.log('using mock raise event for participant status');
        return Promise.resolve();
    }

    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void> {
        console.log('using mock raise participant self test failed event');
        return Promise.resolve();
    }

    getSelfTestToken(participantId: string): Promise<TokenResponse> {
        console.log('using mock get token');
        const token = new TokenResponse({
            expires_on: new Date().toDateString(),
            token: participantId
        });
        return Promise.resolve(token);
    }

    getConferenceChatHistory(conferenceId: string): Promise<ChatResponse[]> {
        console.log('using mock get conference chat history');
        return Promise.resolve(new ConferenceTestData().getChatHistory(this.username, conferenceId));
    }

    getParticipantHeartbeats(conferenceId: string, participantId: string): Promise<ParticipantHeartbeatResponse[]> {
        throw new Error('Method not implemented.');
    }

    updateParticipantDetails(conferenceId: string, participantId: string, updateParticipantRequest: UpdateParticipantRequest) {
        return Promise.resolve();
    }
}
