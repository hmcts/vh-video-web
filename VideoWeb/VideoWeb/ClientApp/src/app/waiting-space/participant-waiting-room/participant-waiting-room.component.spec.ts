import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { Subscription } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus, TokenResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { AnalogueClockStubComponent } from 'src/app/testing/stubs/analogue-clock-stub';
import { IndividualConsultationControlsStubComponent } from 'src/app/testing/stubs/individual-consultation-controls-stub';
import {
    IndividualParticipantStatusListStubComponent,
    JudgeParticipantStatusListStubComponent
} from 'src/app/testing/stubs/participant-status-list-stub';
import { Hearing } from '../../shared/models/hearing';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent when conference exists', () => {
    let component: ParticipantWaitingRoomComponent;
    let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let route: ActivatedRoute;
    let adalService: MockAdalService;
    let eventService: MockEventsService;
    let pexipSpy: any;
    const futureConference = new ConferenceTestData().getConferenceDetailFuture();
    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceById',
            'getObfuscatedName',
            'getJwToken'
        ]);
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(futureConference));
        videoWebServiceSpy.getObfuscatedName.and.returnValue('test-obfs');
        pexipSpy = jasmine.createSpyObj('pexipAPI', ['muteAudio', 'disconnect']);
        videoWebServiceSpy.getJwToken.and.returnValue(
            Promise.resolve(
                new TokenResponse({
                    expires_on: '2021',
                    token: 'token'
                })
            )
        );

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [
                ParticipantWaitingRoomComponent,
                IndividualParticipantStatusListStubComponent,
                AnalogueClockStubComponent,
                JudgeParticipantStatusListStubComponent,
                IndividualConsultationControlsStubComponent
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: futureConference.id })
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
        fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
        component = fixture.componentInstance;
        spyOn(component, 'call').and.callFake(() => {
            Promise.resolve(true);
        });
        spyOn(component, 'setupPexipClient').and.callFake(() => Promise.resolve());
        spyOn(component, 'startEventHubSubscribers').and.callFake(() => {});
        spyOn(component, 'getJwtokenAndConnectToPexip').and.callFake(() => Promise.resolve());
        component.heartbeat = jasmine.createSpyObj('heartbeat', ['kill']);
        component.conference = futureConference;
        component.hearing = new Hearing(futureConference);
        component.participant = futureConference.participants.find(x => x.username === 'chris.green@hearings.net');
    });

    it('should create and display conference details', async () => {
        component.ngOnInit();
        await fixture.whenStable();
        expect(component).toBeTruthy();
        expect(component.loadingData).toBeFalsy();
        expect(component.hearing.getConference()).toBeDefined();
    });

    it('should update conference status', () => {
        const message = eventService.nextHearingStatusMessage;
        component.handleConferenceStatusChange(message);
        expect(component.hearing.getConference().status).toBe(message.status);
    });

    it('should update participant status', () => {
        const message = eventService.nextParticipantStatusMessage;
        component.handleParticipantStatusChange(message);
        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status).toBe(message.status);
    });

    it('should return correct conference status text when suspended', () => {
        component.hearing.getConference().status = ConferenceStatus.Suspended;
        expect(component.getConferenceStatusText()).toBe('is suspended');
    });

    it('should return correct conference status text when paused', () => {
        component.hearing.getConference().status = ConferenceStatus.Paused;
        expect(component.getConferenceStatusText()).toBe('is paused');
    });

    it('should return correct conference status text when closed', () => {
        component.hearing.getConference().status = ConferenceStatus.Closed;
        expect(component.getConferenceStatusText()).toBe('is closed');
    });

    it('should return correct conference status text when in session', () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        expect(component.getConferenceStatusText()).toBe('is in session');
    });

    it('should return correct conference status text when not started', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        component.hearing = new Hearing(conference);
        component.hearing.getConference().status = ConferenceStatus.NotStarted;
        expect(component.getConferenceStatusText()).toBe('');
    });

    it('should return is about to begin header text', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        expect(component.getConferenceStatusText()).toBe('is about to begin');
    });

    it('should return is delayed header text', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        expect(component.getConferenceStatusText()).toBe('is delayed');
    });

    it('should not show video stream when user is not connected to call', () => {
        component.connected = false;
        component.updateShowVideo();
        expect(component.showVideo).toBeFalsy();
    });

    it('should show video stream when conference is in session', () => {
        component.connected = true;
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.updateShowVideo();
        expect(component.showVideo).toBeTruthy();
    });

    it('should show video stream when participant is in consultation', () => {
        component.connected = true;
        component.hearing.getConference().status = ConferenceStatus.Paused;
        component.participant.status = ParticipantStatus.InConsultation;
        component.updateShowVideo();
        expect(component.showVideo).toBeTruthy();
    });

    it('should not show video stream when hearing is not in session and participant is not in consultation', () => {
        component.connected = true;
        component.hearing.getConference().status = ConferenceStatus.Paused;
        component.participant.status = ParticipantStatus.Available;
        component.updateShowVideo();
        expect(component.showVideo).toBeFalsy();
    });

    it('should not announce hearing is starting when already announced', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => {});
        component.hearingStartingAnnounced = true;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should show self view on-click when currently hidden', () => {
        component.selfViewOpen = false;
        component.toggleView();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should hide self view on-click when currently visible', () => {
        component.selfViewOpen = true;
        component.toggleView();
        expect(component.selfViewOpen).toBeFalsy();
    });

    it('should announce hearing about to start', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        component.conference = conference;
        component.hearing = hearing;
        component.hearingStartingAnnounced = false;
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => {});

        component.checkIfHearingIsStarting();

        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(1);
    });

    it('should not announce hearing about to start when already announed', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        component.conference = conference;
        component.hearing = hearing;
        component.hearingStartingAnnounced = true;
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => {});

        component.checkIfHearingIsStarting();

        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should not announce hearing not ready to start', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const hearing = new Hearing(conference);
        component.conference = conference;
        component.hearing = hearing;
        component.hearingStartingAnnounced = false;
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => {});

        component.checkIfHearingIsStarting();

        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should navigate back to list when hearing has been closed for 30 minutes', () => {
        const router = TestBed.get(Router);
        spyOn(router, 'navigate');
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 30);
        conference.closed_date_time = closedDateTime;
        const hearing = new Hearing(conference);
        component.conference = conference;
        component.hearing = hearing;
        component.clockSubscription = new Subscription();

        component.checkIfHearingIsClosed();

        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
    });

    it('should get latest conference when status changes to closed', () => {
        spyOn(component, 'getConferenceClosedTime');
        const message = new ConferenceStatusMessage(component.conference.id, ConferenceStatus.Closed);
        component.handleConferenceStatusChange(message);

        expect(component.getConferenceClosedTime).toHaveBeenCalledWith(component.hearing.id);
    });

    it('should raise leave consultation request on cancel consultation request', async () => {
        const consultationService = TestBed.get(ConsultationService);
        spyOn(consultationService, 'leaveConsultation');

        await component.onConsultationCancelled();
        expect(consultationService.leaveConsultation).toHaveBeenCalledWith(component.conference, component.participant);
    });

    it('should set hearingStartingAnnounced to true when called', () => {
        component.hearingStartingAnnounced = false;
        const sound = jasmine.createSpyObj<HTMLAudioElement>('Audio', ['load', 'play']);
        sound.play.and.returnValue(Promise.resolve());
        component.hearingAlertSound = sound;
        component.announceHearingIsAboutToStart();
        expect(component.hearingStartingAnnounced).toBeTruthy();
    });

    it('should get conference closed time and update properties', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 30);
        conference.closed_date_time = closedDateTime;
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(conference));

        component.conference.closed_date_time = undefined;

        await component.getConferenceClosedTime(conference.id);

        expect(component.conference.closed_date_time).toBeDefined();
    });

    it('should mute the participant when user opts to mute the call', () => {
        pexipSpy.muteAudio.and.returnValue(true);
        component.pexipAPI = pexipSpy;
        component.muteUnmuteCall();
        expect(component.audioMuted).toBeTruthy();
    });

    it('should unmute the participant when user opts to turn off mute option', () => {
        component.pexipAPI = pexipSpy;
        pexipSpy.muteAudio.and.returnValue(true);
        component.muteUnmuteCall(); // Mute the call
        pexipSpy.muteAudio.and.returnValue(false);
        component.muteUnmuteCall(); // Unmute the call
        expect(component.audioMuted).toBeFalsy();
    });
});
