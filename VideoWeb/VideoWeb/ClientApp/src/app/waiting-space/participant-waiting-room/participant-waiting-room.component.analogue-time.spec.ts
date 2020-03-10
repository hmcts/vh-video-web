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

    configureTestSuite(() => {
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
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
        component = fixture.componentInstance;
    });

    it('should return delayed class when conference is suspended', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        component.hearing = new Hearing(conference);
        component.hearing.getConference().status = ConferenceStatus.Suspended;
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return delayed class when conference is delayed', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.scheduled_date_time = conference.scheduled_date_time;
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return hearing-near-start class when conference is due to begin', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
    });

    it('should return hearing-on-time class when conference has not started and on time', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has paused', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.Paused;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has closed', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.Closed;
        component.hearing = new Hearing(conference);
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });
});
