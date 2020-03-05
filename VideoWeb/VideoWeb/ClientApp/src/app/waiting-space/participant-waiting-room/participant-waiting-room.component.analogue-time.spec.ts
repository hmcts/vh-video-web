import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite, createStableTestContext, createTestContext } from 'ng-bullet';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus, TokenResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
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
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';

describe('ParticipantWaitingRoomComponent message and clock', () => {
    let component: ParticipantWaitingRoomComponent;
    let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let route: ActivatedRoute;
    let adalService: MockAdalService;
    let eventService: MockEventsService;

    configureTestSuite(() => {
        // const conference = new ConferenceTestData().getConferenceDetail();
        // videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        //     'getConferenceById',
        //     'getObfuscatedName',
        //     'getJwToken'
        // ]);
        // videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));
        // videoWebServiceSpy.getObfuscatedName.and.returnValue('test-obfs');

        // videoWebServiceSpy.getJwToken.and.returnValue(
        //     of(
        //         new TokenResponse({
        //             expires_on: '2021',
        //             token: 'token'
        //         })
        //     )
        // );

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
                // {
                //     provide: ActivatedRoute,
                //     useValue: {
                //         snapshot: {
                //             paramMap: convertToParamMap({ conferenceId: conference.id })
                //         }
                //     }
                // },
                { provide: VideoWebService, useClass: MockVideoWebService },
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
    });

    it('should return delayed class when conference is suspended', () => {
        const conference = new ConferenceTestData().getConferencePast();
        component.hearing = new Hearing(conference);
        component.hearing.getConference().status = ConferenceStatus.Suspended;
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return delayed class when conference is delayed', () => {
        const conference = new ConferenceTestData().getConferencePast();
        conference.scheduled_date_time = conference.scheduled_date_time;
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return hearing-near-start class when conference is due to begin', () => {
        const conference = new ConferenceTestData().getConferenceNow();
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
    });

    it('should return hearing-on-time class when conference has not started and on time', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has paused', () => {
        const conference = new ConferenceTestData().getConferencePast();
        conference.status = ConferenceStatus.Paused;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has closed', () => {
        const conference = new ConferenceTestData().getConferencePast();
        conference.status = ConferenceStatus.Closed;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });
});
