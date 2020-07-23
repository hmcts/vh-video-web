import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomType,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    adminConsultationMessageSubjectMock,
    eventHubDisconnectSubjectMock,
    eventHubReconnectSubjectMock,
    eventsServiceSpy,
    hearingStatusSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Hearing } from '../../../shared/models/hearing';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent event hub events', () => {
    let component: ParticipantWaitingRoomComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const adminConsultationMessageSubject = adminConsultationMessageSubjectMock;
    const eventHubDisconnectSubject = eventHubDisconnectSubjectMock;
    const eventHubReconnectSubject = eventHubReconnectSubjectMock;

    const videoCallService = videoCallServiceSpy;
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: gloalConference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let adalService: jasmine.SpyObj<AdalService>;
    let errorService: jasmine.SpyObj<ErrorService>;

    let clockService: jasmine.SpyObj<ClockService>;
    let router: jasmine.SpyObj<Router>;
    let heartbeatModelMapper: HeartbeatModelMapper;
    let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;

    let consultationService: jasmine.SpyObj<ConsultationService>;
    const logger: Logger = new MockLogger();

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
    });

    beforeEach(() => {
        component = new ParticipantWaitingRoomComponent(
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
            consultationService,
            clockService
        );

        const conference = new ConferenceResponse(Object.assign({}, gloalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscription$.unsubscribe();
    });

    it('should update conference status and show video when "in session" message received', fakeAsync(() => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(gloalConference.id, status);
        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.resetMute).toHaveBeenCalledTimes(0);
        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeTruthy();
        expect(component.getConferenceStatusText()).toBe('is in session');
    }));

    it('should update conference status and get closeed time when "closed" message received', fakeAsync(() => {
        spyOn(component, 'resetMute').and.callThrough();
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
        expect(component.getConferenceStatusText()).toBe('is closed');
        expect(component.resetMute).toHaveBeenCalledTimes(0);
    }));

    it('should return correct conference status text when suspended', fakeAsync(() => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ConferenceStatus.Suspended;
        const message = new ConferenceStatusMessage(gloalConference.id, status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
        expect(component.getConferenceStatusText()).toBe('is suspended');
        expect(component.resetMute).toHaveBeenCalledTimes(0);
    }));

    it('should return correct conference status text when paused', fakeAsync(() => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ConferenceStatus.Paused;
        const message = new ConferenceStatusMessage(gloalConference.id, status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
        expect(component.getConferenceStatusText()).toBe('is paused');
        expect(component.resetMute).toHaveBeenCalledTimes(0);
    }));

    it('should update participant status to available', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.username, gloalConference.id, status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status).toBe(message.status);
        expect(component.isAdminConsultation).toBeFalsy();
        expect(component.showVideo).toBeFalsy();
        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should update logged in participant status to in consultation', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, participant.username, gloalConference.id, status);
        component.connected = true;

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalled();
        expect(component.participant.status).toBe(message.status);
        expect(component.showVideo).toBeTruthy();
        expect(component.isAdminConsultation).toBeFalsy();
    });

    it('should update non logged in participant status to in consultation', () => {
        const status = ParticipantStatus.InConsultation;
        const participant = gloalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
        const message = new ParticipantStatusMessage(participant.id, participant.username, gloalConference.id, status);
        component.connected = true;
        component.participant.status = ParticipantStatus.Available;
        participantStatusSubject.next(message);

        const postUpdateParticipant = component.hearing.getConference().participants.find(p => p.id === message.participantId);
        expect(postUpdateParticipant.status).toBe(message.status);
        expect(component.showVideo).toBeFalsy();
    });

    it('should not set isAdminConsultation to true when participant has rejected admin consultation', () => {
        const message = new AdminConsultationMessage(
            gloalConference.id,
            RoomType.ConsultationRoom1,
            globalParticipant.username,
            ConsultationAnswer.Rejected
        );
        adminConsultationMessageSubject.next(message);
        expect(component.isAdminConsultation).toBeFalsy();
    });

    it('should set isAdminConsultation to true when participant accepts admin consultation', () => {
        const message = new AdminConsultationMessage(
            gloalConference.id,
            RoomType.ConsultationRoom1,
            globalParticipant.username,
            ConsultationAnswer.Accepted
        );
        adminConsultationMessageSubject.next(message);
        expect(component.isAdminConsultation).toBeTruthy();
    });

    it('should get conference when disconnected from eventhub less than 7 times', fakeAsync(() => {
        component.participant.status = ParticipantStatus.InHearing;
        component.conference.status = ConferenceStatus.InSession;

        const newParticipantStatus = ParticipantStatus.InConsultation;
        const newConferenceStatus = ConferenceStatus.Paused;
        const newConference = new ConferenceResponse(Object.assign({}, gloalConference));
        newConference.status = newConferenceStatus;
        newConference.participants.find(x => x.id === globalParticipant.id).status = newParticipantStatus;

        videoWebService.getConferenceById.and.resolveTo(newConference);
        eventHubDisconnectSubject.next(1);
        eventHubDisconnectSubject.next(2);
        eventHubDisconnectSubject.next(3);
        eventHubDisconnectSubject.next(4);
        eventHubDisconnectSubject.next(5);
        eventHubDisconnectSubject.next(6);

        flushMicrotasks();
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(6);
        expect(component.participant.status).toBe(newParticipantStatus);
        expect(component.conference.status).toBe(newConferenceStatus);
        expect(component.conference).toEqual(newConference);
    }));

    it('should go to service error when disconnected from eventhub more than 7 times', () => {
        eventHubDisconnectSubject.next(8);
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(0);
        expect(errorService.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
    });

    it('should get conference on eventhub reconnect', () => {
        videoWebService.getConferenceById.calls.reset();
        errorService.goToServiceError.calls.reset();
        eventHubReconnectSubject.next();
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(1);
    });
});
