import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { JudgeEventService } from 'src/app/services/judge-event.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let eventsService: jasmine.SpyObj<EventsService>;
    const mockEventService = new MockEventsService();
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();
    let judgeEventService: jasmine.SpyObj<JudgeEventService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'raiseParticipantEvent']);
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.raiseParticipantEvent.and.returnValue(Promise.resolve());
        judgeEventService = jasmine.createSpyObj<JudgeEventService>('JudgeEventService', [
            'raiseJudgeAvailableEvent',
            'raiseJudgeUnavailableEvent'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError', 'goToUnauthorised']);

        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
            'start',
            'getHearingStatusMessage',
            'getParticipantStatusMessage',
            'getServiceDisconnected',
            'getServiceReconnected',
            'getHeartbeat'
        ]);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());
        eventsService.getParticipantStatusMessage.and.returnValue(mockEventService.participantStatusSubject.asObservable());
        eventsService.getServiceDisconnected.and.returnValue(mockEventService.eventHubDisconnectSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());
        eventsService.getHeartbeat.and.returnValue(mockEventService.participantHeartbeat.asObservable());
    });

    beforeEach(fakeAsync(() => {
        judgeEventService.raiseJudgeUnavailableEvent.calls.reset();
        judgeEventService.raiseJudgeAvailableEvent.calls.reset();
        errorService.handleApiError.calls.reset();

        component = new JudgeWaitingRoomComponent(
            activatedRoute,
            router,
            videoWebService,
            eventsService,
            errorService,
            logger,
            judgeEventService
        );
        component.ngOnInit();
        flushMicrotasks();
    }));

    it('should create and display conference details', async () => {
        expect(component).toBeTruthy();
        expect(component.loadingData).toBeFalsy();
        expect(component.conference).toBeDefined();
    });

    it('should update conference status', async () => {
        const conferenceStatus = ConferenceStatus.InSession;
        component.handleHearingStatusChange(conferenceStatus);
        expect(component.conference.status).toBe(conferenceStatus);
    });

    it('should update participant status', async () => {
        const pat = conference.participants[0];
        const message = new ParticipantStatusMessage(pat.id, pat.username, conference.id, ParticipantStatus.InConsultation);
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status).toBe(message.status);
    });

    it('should return correct conference status text when suspended', async () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.getConferenceStatusText()).toBe('Hearing suspended');
    });

    it('should return correct conference status text when paused', async () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.getConferenceStatusText()).toBe('Hearing paused');
    });

    it('should return correct conference status text when closed', async () => {
        component.conference.status = ConferenceStatus.Closed;
        expect(component.getConferenceStatusText()).toBe('Hearing is closed');
    });

    it('should return correct conference status text when in session', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.getConferenceStatusText()).toBe('Hearing is in session');
    });

    it('should return correct conference status text when not started', async () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.getConferenceStatusText()).toBe('Start this hearing');
    });

    it('should return true when conference is paused', async () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.isPaused()).toBeTruthy();
    });

    it('should return false when conference is not paused', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isPaused()).toBeFalsy();
    });

    it('should return true when conference is not started', async () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.isNotStarted()).toBeTruthy();
    });

    it('should return false when conference is has started', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isNotStarted()).toBeFalsy();
    });

    it('should navigate to hearing room with conference id', async () => {
        component.goToHearingPage();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingRoom, component.conference.id]);
    });

    it('should navigate to check equipment with conference id', async () => {
        component.checkEquipment();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, component.conference.id]);
    });

    it('should navigate to judge hearing list', async () => {
        component.goToJudgeHearingList();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should raise judge avaliable event', () => {
        component.ngOnInit();
        expect(judgeEventService.raiseJudgeAvailableEvent).toHaveBeenCalled();
    });

    it('should call the raiseJudgeAvailable event when judge is disconnected and conference is paused', async () => {
        const conferenceStatus = ConferenceStatus.Paused;
        component.handleHearingStatusChange(conferenceStatus);

        const message = mockEventService.nextJudgeStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status);
        expect(judgeEventService.raiseJudgeAvailableEvent).toHaveBeenCalled();
    });

    it('should call the raiseJudgeAvailable event when conference is suspended', async () => {
        const conferenceStatus = ConferenceStatus.Suspended;
        component.handleHearingStatusChange(conferenceStatus);

        const message = mockEventService.nextJudgeStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status);
        expect(judgeEventService.raiseJudgeAvailableEvent).toHaveBeenCalled();
    });

    it('should return "hearingSuspended" true when conference status is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.hearingSuspended()).toBeTruthy();
    });

    it('should return "hearingSuspended" false when conference status is not suspended', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingSuspended()).toBeFalsy();
    });

    it('should return "hearingPaused" true when conference status is paused', () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.hearingPaused()).toBeTruthy();
    });

    it('should return "hearingPaused" false when conference status is not paused', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingPaused()).toBeFalsy();
    });

    it('should get latest conference on eventhub disconnect', () => {
        mockEventService.eventHubDisconnectSubject.next(1);
        expect(videoWebService.getConferenceById).toHaveBeenCalled();
    });

    it('should get latest conference on eventhub disconnect', () => {
        mockEventService.eventHubReconnectSubject.next();
        expect(videoWebService.getConferenceById).toHaveBeenCalled();
    });

    it('should update hearing status when message received', () => {
        component.conference.status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conference.id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.conference.status).toBe(message.status);
    });

    it('should update participant status when message received', () => {
        const participant = conference.participants[0];
        component.conference.participants[0].status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conference.id, ParticipantStatus.InConsultation);

        mockEventService.participantStatusSubject.next(message);

        expect(component.conference.participants[0].status).toBe(message.status);
    });

    it('should post judge unavailable when leaving waiting room', () => {
        component.ngOnDestroy();
        expect(judgeEventService.raiseJudgeUnavailableEvent).toHaveBeenCalled();
    });

    it('should handle error when get conference fails', async () => {
        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);

        await component.getConference();

        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should return false when unable to raise judge unavailable event', async () => {
        const error = { status: 401, isApiException: true };
        judgeEventService.raiseJudgeUnavailableEvent.and.rejectWith(error);
        component.hearing = new Hearing(conference);

        const result = await component.postEventJudgeUnvailableStatus();

        expect(result).toBeFalsy();
    });
});
