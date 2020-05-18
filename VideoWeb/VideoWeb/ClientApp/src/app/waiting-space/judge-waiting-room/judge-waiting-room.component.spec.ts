import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { JudgeEventService } from 'src/app/services/judge-event.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { JudgeChatStubComponent } from 'src/app/testing/stubs/judge-chat-stub.component';
import { JudgeParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    let fixture: ComponentFixture<JudgeWaitingRoomComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let route: ActivatedRoute;
    let router: Router;
    let conference: ConferenceResponse;
    let eventService: MockEventsService;
    let judgeEventServiceSpy: jasmine.SpyObj<JudgeEventService>;

    configureTestSuite(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'raiseParticipantEvent']);
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebServiceSpy.raiseParticipantEvent.and.returnValue(Promise.resolve());
        judgeEventServiceSpy = jasmine.createSpyObj<JudgeEventService>('JudgeEventService', [
            'raiseJudgeAvailableEvent',
            'raiseJudgeUnavailableEvent'
        ]);

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeWaitingRoomComponent, JudgeParticipantStatusListStubComponent, JudgeChatStubComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger },
                { provide: JudgeEventService, useValue: judgeEventServiceSpy }
            ]
        });
    });

    beforeEach(async () => {
        eventService = TestBed.get(EventsService);
        route = TestBed.get(ActivatedRoute);
        router = TestBed.get(Router);
        fixture = TestBed.createComponent(JudgeWaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

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
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.goToHearingPage();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingRoom, component.conference.id]);
    });

    it('should navigate to check equipment with conference id', async () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.checkEquipment();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, component.conference.id]);
    });

    it('should navigate to judge hearing list', async () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.goToJudgeHearingList();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should raise judge avaliable event', () => {
        component.ngOnInit();
        expect(judgeEventServiceSpy.raiseJudgeAvailableEvent).toHaveBeenCalled();
    });

    it('should call the raiseJudgeAvailable event when judge is disconnected and conference is paused', async () => {
        const conferenceStatus = ConferenceStatus.Paused;
        component.handleHearingStatusChange(conferenceStatus);

        const message = eventService.nextJudgeStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status);
        expect(judgeEventServiceSpy.raiseJudgeAvailableEvent).toHaveBeenCalled();
    });

    it('should call the raiseJudgeAvailable event when conference is suspended', async () => {
        const conferenceStatus = ConferenceStatus.Suspended;
        component.handleHearingStatusChange(conferenceStatus);

        const message = eventService.nextJudgeStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status);
        expect(judgeEventServiceSpy.raiseJudgeAvailableEvent).toHaveBeenCalled();
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
        eventService.eventHubDisconnectSubject.next(1);
        expect(videoWebServiceSpy.getConferenceById).toHaveBeenCalled();
    });

    it('should get latest conference on eventhub disconnect', () => {
        eventService.eventHubReconnectSubject.next();
        expect(videoWebServiceSpy.getConferenceById).toHaveBeenCalled();
    });

    it('should update hearing status when message received', () => {
        component.conference.status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conference.id, ConferenceStatus.Paused);

        eventService.hearingStatusSubject.next(message);

        expect(component.conference.status).toBe(message.status);
    });

    it('should update participant status when message received', () => {
        const participant = conference.participants[0];
        component.conference.participants[0].status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conference.id, ParticipantStatus.InConsultation);

        eventService.participantStatusSubject.next(message);

        expect(component.conference.participants[0].status).toBe(message.status);
    });
});
