import { discardPeriodicTasks, fakeAsync } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ConferenceResponseVho,
    ConferenceStatus,
    ParticipantForUserResponse,
    ParticipantHeartbeatResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ExtendedConferenceStatus } from 'src/app/shared/models/hearings-filter';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { ParticipantStatusMessage } from '../../services/models/participant-status-message';
import { VhoHearingsComponent } from './vho-hearings.component';
import { VhoHearingListComponent } from '../vho-hearing-list/vho-hearing-list.component';

describe('VhoHearingsComponent', () => {
    let component: VhoHearingsComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    const logger: Logger = new MockLogger();
    const conferences = new ConferenceTestData().getVhoTestData();
    const hearings = conferences.map((c) => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;

    const mockEventService = new MockEventsService();

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();

    beforeAll(() => {
        TestFixtureHelper.setupVenues();
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForVHOfficer',
            'getConferenceById',
            'getTasksForConference',
            'getParticipantHeartbeats'
        ]);
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue('test-url');

        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
            'start',
            'getHearingStatusMessage',
            'getParticipantStatusMessage',
            'getServiceDisconnected',
            'getServiceReconnected',
            'getAdminAnsweredChat',
            'getHeartbeat'
        ]);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());
        eventsService.getParticipantStatusMessage.and.returnValue(mockEventService.participantStatusSubject.asObservable());
        eventsService.getServiceDisconnected.and.returnValue(mockEventService.eventHubDisconnectSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());
        eventsService.getAdminAnsweredChat.and.returnValue(mockEventService.adminAnsweredChatSubject.asObservable());
        eventsService.getHeartbeat.and.returnValue(mockEventService.hearingStatusSubject.asObservable());

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(of(conferences));
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(conferenceDetail));
        videoWebServiceSpy.getTasksForConference.and.returnValue(Promise.resolve(new ConferenceTestData().getTasksForConference()));

        component = new VhoHearingsComponent(videoWebServiceSpy, domSanitizerSpy, errorService, eventsService, logger, router);
        component.conferences = hearings;
        component.conferencesAll = conferences;
    });

    afterAll(() => {
        component.ngOnDestroy();
        TestFixtureHelper.clearVenues();
    });

    it('should load venue selection', () => {
        component.loadVenueSelection();
        expect(component.venueAllocations).toBeDefined();
    });

    it('should setup interval to retrieve conference changes', () => {
        expect(component.interval).toBeUndefined();
        component.setupConferenceInterval();
        expect(component.interval).toBeDefined();
    });

    it('should retrieve conference and sanitise iframe uri', () => {
        component.conferences = hearings;
        spyOn(component, 'updateWidthForAdminFrame');
        spyOn(component, 'getHeightForFrame').and.returnValue(600);

        component.onConferenceSelected(new ConferenceForVhOfficerResponse({ id: component.conferences[0].id }));
        expect(component.selectedConferenceUrl).toBeDefined();
    });

    it('should return true when current conference is selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        expect(component.isCurrentConference(currentConference)).toBeTruthy();
    });

    it('should return false when current conference null', () => {
        const currentConference = conferences[0];
        expect(component.isCurrentConference(currentConference)).toBeFalsy();
    });

    it('should return false when current conference is different', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: conferences[1].id }));
        expect(component.isCurrentConference(currentConference)).toBeFalsy();
    });

    it('should load tasks for conference when current conference is selected', async () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        await component.getTasksForConference(currentConference.id);
        expect(component.tasks.length > 0).toBeTruthy();
    });

    it('should handle error when get tasks fails', async () => {
        const error = { error: 'unable to reach api' };
        videoWebServiceSpy.getTasksForConference.and.callFake(() => Promise.reject(error));
        const currentConference = conferences[0];
        await component.getTasksForConference(currentConference.id);
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should update number of pending tasks on task completed', () => {
        const currentConference = component.conferences[0];
        const initPendingTasks = 5;
        currentConference.numberOfPendingTasks = initPendingTasks;

        component.onTaskCompleted(new TaskCompleted(currentConference.id, 3));
        expect(component.conferences[0].numberOfPendingTasks).toBeLessThan(initPendingTasks);
    });

    it('should reset conference unread counter when vho sends a message', () => {
        const conference = component.conferences[0];
        component.conferences[0].numberOfUnreadMessages = 5;
        component.resetConferenceUnreadCounter(conference.id);
        expect(component.conferences[0].numberOfUnreadMessages).toBe(0);
    });

    it('should show monitoring graph for selected participant', async () => {
        const hearbeatResponse = new ParticipantHeartbeatResponse({
            browser_name: 'Chrome',
            browser_version: '80.0.3987.132',
            recent_packet_loss: 78,
            timestamp: new Date(new Date().toUTCString())
        });
        videoWebServiceSpy.getParticipantHeartbeats.and.returnValue(Promise.resolve([hearbeatResponse]));
        component.displayGraph = false;
        const param = {
            participant: new ParticipantSummary(
                new ParticipantForUserResponse({ id: '1111-2222-3333', display_name: 'Adam', status: ParticipantStatus.Disconnected })
            ),
            conferenceId: '1234-12345678'
        };
        await component.onParticipantSelected(param);
        expect(component.monitoringParticipant).toBeTruthy();
        expect(component.monitoringParticipant.name).toBe('Adam');
        expect(component.monitoringParticipant.status).toBe(ParticipantStatus.Disconnected);
        expect(videoWebServiceSpy.getParticipantHeartbeats).toHaveBeenCalled();
    });

    it('should add participant heartbeat to  the heartbeatList', async () => {
        const heartBeat = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat);
        expect(component.participantsHeartBeat.length > 0);
        expect(component.participantsHeartBeat).toContain(heartBeat);
    });

    it('should set participant heartbeat', async () => {
        const conference = component.conferences[0];
        const heartBeat = new ParticipantHeartbeat(
            conference.id,
            conference.getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.handleHeartbeat(heartBeat);
        expect(component.conferences[0].getParticipants()[0].participantHertBeatHealth).toBe(heartBeat);
    });

    it('should change participant status for particpant when status is disconnected', () => {
        const heartBeat1 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const message = new ParticipantStatusMessage(
            conferenceDetail.participants[0].id,
            conferenceDetail.participants[0].username,
            conferenceDetail.id,
            ParticipantStatus.Disconnected
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        component.participants = conferenceDetail.participants;
        component.handleParticipantStatusChange(message);
        expect(component.participants).not.toBe(undefined);
        expect(component.participants[0].status).toBe(ParticipantStatus.Disconnected);
        expect(component.participantsHeartBeat).not.toContain(heartBeat1);
    });

    it('should change participant status for particpant', async () => {
        const heartBeat = new ParticipantHeartbeat(
            conferences[0].id,
            conferences[0].participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat);
        component.retrieveHearingsForVhOfficer(true);
        expect(component.conferences).not.toBe(undefined);
        expect(component.conferences.length).toBeGreaterThan(0);
        expect(component.participantsHeartBeat).not.toBe(undefined);
        expect(component.participantsHeartBeat.length).toBeGreaterThan(0);
    });

    it('should not update hearbeat when no matching conference', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            '0000-0000-0000-0000',
            '0000-0000-0000-0000',
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.handleHeartbeat(heartBeat1);
        const conferenceToUpdate = component.conferences.find((x) => x.id === heartBeat1.conferenceId);
        expect(conferenceToUpdate).toBe(undefined);
    });

    it('should not update hearbeat when no matching participant', async () => {
        const conference = component.conferences[0];
        const heartBeat1 = new ParticipantHeartbeat(conference.id, '0000-0000-0000-0000', HeartbeatHealth.Good, 'Chrome', '80.0.3987.132');
        component.handleHeartbeat(heartBeat1);
        const conferenceToUpdate = component.conferences.find((x) => x.id === heartBeat1.conferenceId);
        const participantToUpdate = conferenceToUpdate.getParticipants().find((p) => p.id === heartBeat1.participantId);
        expect(participantToUpdate).toBe(undefined);
    });

    it('should change participant status for particpant when status is not disconnected', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const message = new ParticipantStatusMessage(
            conferenceDetail.participants[0].id,
            conferenceDetail.participants[0].username,
            conferenceDetail.id,
            ParticipantStatus.Available
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        component.participants = conferenceDetail.participants;
        component.handleParticipantStatusChange(message);
        expect(component.participants).not.toBe(undefined);
        expect(component.participants[0].status).toBe(ParticipantStatus.Available);
        expect(component.participantsHeartBeat.length).toBe(2);
    });

    it('should add participant heartbeat to the list when heartbeat for participant does not exist previously', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        const participantsHeartbeatCurrentCount = component.participantsHeartBeat.length;
        const heartBeat3 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[2].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat3);
        expect(component.participantsHeartBeat.length).toBeGreaterThan(participantsHeartbeatCurrentCount);
        expect(component.participantsHeartBeat).toContain(heartBeat3);
    });

    it('should update participant heartbeat in the list when heartbeat for participant does exist previously', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        const participantsHeartbeatCurrentCount = component.participantsHeartBeat.length;
        const heartBeat3 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Bad,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat3);
        expect(component.participantsHeartBeat.length).toEqual(participantsHeartbeatCurrentCount);
        expect(component.participantsHeartBeat).toContain(heartBeat3);
    });

    it('should return true when conference is selected', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        component.selectedHearing = new Hearing(conference);
        expect(component.isHearingSelected).toBeTruthy();
    });

    it('should update hearing status when conference status message is received', () => {
        component.setupEventHubSubscribers();
        component.conferences[0].status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conferences[0].id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.conferences[0].status).toBe(message.status);
    });

    it('should selected hearing status when conference status message is received for currently selected conference', () => {
        component.setupEventHubSubscribers();
        const clone: ConferenceResponseVho = Object.assign(conferenceDetail);
        component.selectedHearing = new Hearing(clone);
        component.selectedHearing.getConference().status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(component.selectedHearing.id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.selectedHearing.status).toBe(message.status);
    });

    it('should not update conference status message is received for a conference not in list', () => {
        const message = new ConferenceStatusMessage(Guid.create().toString(), ConferenceStatus.Paused);
        expect(component.handleConferenceStatusChange(message)).toBeFalsy();
    });

    it('should not update participant status when conference is not selected', () => {
        component.setupEventHubSubscribers();
        const participant = conferences[0].participants.find((x) => x.role === Role.Judge);
        component.conferencesAll[0].participants[0].status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferences[0].id, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);
    });

    it('should not update participant status when participant message is received for a difference conference', () => {
        component.setupEventHubSubscribers();
        component.participants = conferenceDetail.participants;
        const participant = conferences[2].participants.find((x) => x.role === Role.Judge);
        component.participants[0].status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferences[0].id, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);
    });

    it('should update participant status when conference participant message is received', () => {
        component.setupEventHubSubscribers();
        component.participants = conferenceDetail.participants;
        const participant = conferenceDetail.participants[0];
        component.participants[0].status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferences[0].id, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);

        expect(component.participants[0].status).toBe(message.status);
    });

    it('should get judge status participant message is received and participant is judge', () => {
        component.setupEventHubSubscribers();
        component.participants = conferenceDetail.participants;
        const participant = conferenceDetail.participants.find((x) => x.role === Role.Judge);
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferences[0].id, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);
    });

    it('should update status to "delayed" when hearing is 10 minutes beyond scheduled start time', () => {
        const delayedConference = new ConferenceTestData().getConferencePast();
        const futureConference = new ConferenceTestData().getConferenceFuture();
        delayedConference.status = ConferenceStatus.NotStarted;
        futureConference.status = ConferenceStatus.NotStarted;
        const result = component.setStatusDelayed([delayedConference, futureConference]);
        expect(result[0].statusExtended).toBe(ExtendedConferenceStatus.Delayed);
        expect(result[1].statusExtended).toBe(ConferenceStatus.NotStarted);
    });

    it('should not show filter', () => {
        component.displayFilter = true;
        component.showFilter();
        expect(component.displayFilter).toBeFalsy();
    });

    it('should show filter', () => {
        component.displayFilter = false;
        component.showFilter();
        expect(component.displayFilter).toBeTruthy();
    });

    it('should return false when checking is "hasHearings" and still loading', () => {
        component.loadingData = true;
        component.conferencesAll = undefined;
        expect(component.hasHearings).toBeFalsy();
    });

    it('should return false when checking is "hasHearings" and conference is not set', () => {
        component.loadingData = false;
        component.conferencesAll = undefined;
        expect(component.hasHearings).toBeFalsy();
    });

    it('should return false when checking is "hasHearings" and conference is empty list', () => {
        component.loadingData = false;
        component.conferencesAll = [];
        expect(component.hasHearings).toBeFalsy();
    });

    it('should return true when checking is "hasHearings" and conference list is not empty', () => {
        component.loadingData = false;
        component.conferencesAll = conferences;
        expect(component.hasHearings).toBeTruthy();
    });

    it('should load venues, interval and retrieve conferences', fakeAsync(() => {
        component.loadingData = false;
        component.conferencesAll = undefined;
        component.conferencesSubscription = undefined;

        component.ngOnInit();

        discardPeriodicTasks();
        expect(component.conferencesAll.length).toBeGreaterThan(0);
        expect(component.conferences.length).toBeGreaterThan(0);
        expect(component.conferencesSubscription).toBeDefined();
        expect(component.interval).toBeDefined();
    }));

    it('should reset unread message counter when admin has answered', () => {
        component.conferences[0].numberOfUnreadMessages = 10;

        mockEventService.adminAnsweredChatSubject.next(component.conferences[0].id);

        expect(component.conferences[0].numberOfUnreadMessages).toBe(0);
    });

    it('should not reset unread message counter when conference id does not exist', () => {
        component.conferences[0].numberOfUnreadMessages = 10;

        mockEventService.adminAnsweredChatSubject.next(Guid.create().toString());

        expect(component.conferences[0].numberOfUnreadMessages).toBe(10);
    });

    it('should go back to venue list selection page', () => {
        component.goBackToVenueSelection();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminVenueList);
    });

    it('should refresh data on eventhub disconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');
        errorService.goToServiceError.calls.reset();

        component.setupEventHubSubscribers();
        mockEventService.eventHubDisconnectSubject.next(1);
        mockEventService.eventHubDisconnectSubject.next(2);
        mockEventService.eventHubDisconnectSubject.next(3);
        mockEventService.eventHubDisconnectSubject.next(4);
        mockEventService.eventHubDisconnectSubject.next(5);
        mockEventService.eventHubDisconnectSubject.next(6);

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(6);
        expect(errorService.goToServiceError).toHaveBeenCalledTimes(0);
    });

    it('should redirect to service error when disconnected more than 6 times', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');

        component.setupEventHubSubscribers();
        errorService.goToServiceError.calls.reset();
        mockEventService.eventHubDisconnectSubject.next(7);
        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(0);
        expect(errorService.goToServiceError).toHaveBeenCalled();
    });

    it('should refresh data on eventhub reconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');

        component.setupEventHubSubscribers();
        mockEventService.eventHubReconnectSubject.next();

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should not be full screen if there are no hearings', () => {
        spyOn(component, 'enableFullScreen');
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(of([]));
        component.retrieveHearingsForVhOfficer(true);
        expect(component.enableFullScreen).toHaveBeenCalledWith(false);
    });

    it('should hide filter on apply', () => {
        component.displayFilter = true;
        const vhoHearingListComponentSpy = jasmine.createSpyObj<VhoHearingListComponent>('VhoHearingListComponent', [
            'currentConference',
            'selectConference'
        ]);
        component.$conferenceList = vhoHearingListComponentSpy;
        const filter = new ConferenceTestData().getHearingsFilter();
        component.applyFilters(filter);
        expect(component.displayFilter).toBeFalsy();
    });

    it('should toggle fullscreen class on master-container', () => {
        const id = 'master-container';
        const masterContainer = document.createElement('div');
        masterContainer.setAttribute('id', id);
        document.getElementById = jasmine.createSpy(id).and.returnValue(masterContainer);

        component.enableFullScreen(true);
        expect(masterContainer.classList.contains('fullscreen')).toBeTruthy();
        component.enableFullScreen(false);
        expect(masterContainer.classList.contains('fullscreen')).toBeFalsy();
    });

    it('should adminFrameWith to maxWidth possible', () => {
        component.updateWidthForAdminFrame();
        expect(component.adminFrameWidth).toBeGreaterThan(0);
        expect(component.adminFrameWidth).toBe(window.innerWidth - 350);
    });
});
