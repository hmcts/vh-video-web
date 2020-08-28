import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Guid } from 'guid-typescript';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    TokenResponse,
    EndpointStatus
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    endpointStatusSubjectMock,
    eventsServiceSpy,
    hearingStatusSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { JudgeWaitingRoomComponent } from '../judge-waiting-room.component';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast();
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];
    const globalEndpoint = gloalConference.endpoints[0];
    const videoCallService = videoCallServiceSpy;

    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: gloalConference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const participantStatusSubject = participantStatusSubjectMock;
    const endpointStatusSubject = endpointStatusSubjectMock;

    let adalService: jasmine.SpyObj<AdalService>;
    let errorService: jasmine.SpyObj<ErrorService>;

    let clockService: jasmine.SpyObj<ClockService>;
    let router: jasmine.SpyObj<Router>;
    let heartbeatModelMapper: HeartbeatModelMapper;
    let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;

    let consultationService: jasmine.SpyObj<ConsultationService>;
    const logger: Logger = new MockLogger();

    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;

    const jwToken = new TokenResponse({
        expires_on: '06/10/2020 01:13:00',
        token:
            'eyJhbGciOiJIUzUxMuIsInR5cCI6IkpXRCJ9.eyJ1bmlxdWVfbmFtZSI6IjA0NjllNGQzLTUzZGYtNGExYS04N2E5LTA4OGI0MmExMTQxMiIsIm5iZiI6MTU5MTcyMjcyMCwiZXhwIjoxNTkxNzUxNjQwLCJpYXQiOjE1OTE3MjI3ODAsImlzcyI6ImhtY3RzLnZpZGVvLmhlYXJpbmdzLnNlcnZpY2UifO.USebpA7R7GUiPwF-uSuAd7Sx-bveOFi8LNE3oV7SLxdxASTlq7MfwhgYJhaC69OQAhWcrV7wSdcZ2OS-ZHkSUg'
    });

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceById',
            'getObfuscatedName',
            'getJwToken'
        ]);
        videoWebService.getConferenceById.and.resolveTo(gloalConference);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
        videoWebService.getJwToken.and.resolveTo(jwToken);

        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: globalParticipant.username, authenticated: true }
        });
        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError', 'handleApiError']);

        clockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        heartbeatModelMapper = new HeartbeatModelMapper();
        deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', ['getBrowserName', 'getBrowserVersion']);
        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', ['leaveConsultation']);

        audioRecordingService = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', ['getAudioStreamInfo']);
    });

    beforeEach(async () => {
        component = new JudgeWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            audioRecordingService
        );

        const conference = new ConferenceResponse(Object.assign({}, gloalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
        router.navigate.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscription$.unsubscribe();
    });

    it('should update conference status and show video when "in session" message received', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(gloalConference.id, status);
        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeTruthy();
        expect(component.getConferenceStatusText()).toBe('Hearing is in session');
        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));

    it('should update conference status and get closeed time when "closed" message received', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const confWithCloseTime = new ConferenceResponse(Object.assign({}, gloalConference));
        confWithCloseTime.closed_date_time = new Date();
        confWithCloseTime.status = status;
        videoWebService.getConferenceById.and.resolveTo(confWithCloseTime);

        const message = new ConferenceStatusMessage(gloalConference.id, status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(gloalConference.id);
        expect(component.getConferenceStatusText()).toBe('Hearing is closed');
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    }));

    it('should ignore conference updates for another conference', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const message = new ConferenceStatusMessage(Guid.create().toString(), status);
        component.hearing.getConference().status = ConferenceStatus.InSession;
        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(ConferenceStatus.InSession);
    }));

    it('should ignore participant updates for another conference', fakeAsync(() => {
        const status = ParticipantStatus.Disconnected;
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.username, Guid.create().toString(), status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status).toBeFalsy();
    }));

    it('should ignore endpoint updates for another conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, Guid.create().toString(), status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.status === message.status).toBeFalsy();
    }));

    it('should ignore endpoint updates for not in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(Guid.create().toString(), gloalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoints = component.hearing.getEndpoints().filter(x => x.status === status);
        expect(endpoints.length).toBe(0);
    }));

    it('should updates endpoint in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, gloalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.status === message.status).toBeTruthy();
    }));
});
