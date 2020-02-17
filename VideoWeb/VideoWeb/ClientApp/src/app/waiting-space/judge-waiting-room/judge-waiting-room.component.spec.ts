import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { JudgeParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';
import { JudgeChatStubComponent } from 'src/app/testing/stubs/judge-chat-stub.component';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    let fixture: ComponentFixture<JudgeWaitingRoomComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let route: ActivatedRoute;
    let router: Router;
    let conference: ConferenceResponse;
    let adalService: MockAdalService;
    let eventService: MockEventsService;

    configureTestSuite(() => {
        conference = new ConferenceTestData().getConferenceDetail();
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'raiseParticipantEvent']);
        videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));
        videoWebServiceSpy.raiseParticipantEvent.and.returnValue(of());

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
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
        route = TestBed.get(ActivatedRoute);
        router = TestBed.get(Router);
        fixture = TestBed.createComponent(JudgeWaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and display conference details', async done => {
        await fixture.whenStable();
        expect(component).toBeTruthy();
        expect(component.loadingData).toBeFalsy();
        expect(component.conference).toBeDefined();
        done();
    });

    it('should update conference status', async done => {
        await fixture.whenStable();
        const conferenceStatus = ConferenceStatus.InSession;
        component.handleHearingStatusChange(conferenceStatus);
        expect(component.conference.status).toBe(conferenceStatus);
        done();
    });
    it('should post event for judge status', () => {
        component.ngOnInit();
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalled();
    });

    it('should update participant status', async done => {
        await fixture.whenStable();
        const message = eventService.nextParticipantStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.conference.participants.find(x => x.id === message.participantId);
        expect(participant.status !== message.status);
        done();
    });

    it('should return correct conference status text when suspended', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.getConferenceStatusText()).toBe('Hearing suspended');
        done();
    });

    it('should return correct conference status text when paused', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.Paused;
        expect(component.getConferenceStatusText()).toBe('Hearing paused');
        done();
    });

    it('should return correct conference status text when closed', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.Closed;
        expect(component.getConferenceStatusText()).toBe('Hearing is closed');
        done();
    });

    it('should return correct conference status text when in session', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.InSession;
        expect(component.getConferenceStatusText()).toBe('Hearing is in session');
        done();
    });

    it('should return correct conference status text when not started', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.getConferenceStatusText()).toBe('Start this hearing');
        done();
    });

    it('should return true when conference is paused', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.Paused;
        expect(component.isPaused()).toBeTruthy();
        done();
    });

    it('should return false when conference is not paused', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isPaused()).toBeFalsy();
        done();
    });

    it('should return true when conference is not started', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.isNotStarted()).toBeTruthy();
        done();
    });

    it('should return false when conference is has started', async done => {
        await fixture.whenStable();
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isNotStarted()).toBeFalsy();
        done();
    });

    it('should navigate to hearing room with conference id', async done => {
        spyOn(router, 'navigate').and.callFake(() => {
            Promise.resolve(true);
        });
        await fixture.whenStable();
        component.goToHearingPage();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingRoom, component.conference.id]);
        done();
    });

    it('should navigate to check equipment with conference id', async done => {
        spyOn(router, 'navigate').and.callFake(() => {
            Promise.resolve(true);
        });
        await fixture.whenStable();
        component.checkEquipment();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, component.conference.id]);
        done();
    });
});
