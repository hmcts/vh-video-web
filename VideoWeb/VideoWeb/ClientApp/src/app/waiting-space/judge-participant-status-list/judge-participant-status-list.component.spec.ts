import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { ConfigService } from 'src/app/services/api/config.service';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { VideoWebService } from '../../services/api/video-web.service';
import { Logger } from '../../services/logging/logger-base';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list.component';

describe('JudgeParticipantStatusListComponent', () => {
    let component: JudgeParticipantStatusListComponent;
    let fixture: ComponentFixture<JudgeParticipantStatusListComponent>;
    let adalService: MockAdalService;
    let eventService: MockEventsService;
    let videoWebService: MockVideoWebService;
    let logger: MockLogger;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [JudgeParticipantStatusListComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
        videoWebService = TestBed.get(VideoWebService);
        logger = TestBed.get(Logger);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JudgeParticipantStatusListComponent);
        component = fixture.componentInstance;
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
    });

    it('should show input template for change judge display name', () => {
        component.changeJudgeNameShow();
        expect(component.showChangeJudgeDisplayName).toBe(true);
        expect(component.newJudgeDisplayName).toBe(component.judge.display_name);
    });
    it('should hide input template for change judge display name', () => {
        component.cancelJudgeDisplayName();
        expect(component.showChangeJudgeDisplayName).toBe(false);
    });
    it('should update new judge display name with user input', () => {
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        expect(component.newJudgeDisplayName).toBe(newName);
    });
    it('should save new judge display name in database', () => {
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        component.saveJudgeDisplayName();
        expect(component.judge.display_name).toBe(newName);
        expect(component.showChangeJudgeDisplayName).toBe(false);
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'Connected' },
        { status: ParticipantStatus.InConsultation, expected: 'In Consultation' },
        { status: ParticipantStatus.InHearing, expected: 'Connected' },
        { status: ParticipantStatus.Disconnected, expected: 'Disconnected' },
        { status: ParticipantStatus.Joining, expected: 'Joining' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Not Signed In' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unable To Join' },
        { status: ParticipantStatus.None, expected: 'Not Signed In' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatus(pat)).toBe(test.expected);
        });
    });

    const participantStatusCssTestCases = [
        { status: ParticipantStatus.Available, expected: 'available' },
        { status: ParticipantStatus.Disconnected, expected: 'disconnected' },
        { status: ParticipantStatus.InConsultation, expected: 'in_consultation' },
        { status: ParticipantStatus.InHearing, expected: 'in_hearing' },
        { status: ParticipantStatus.Joining, expected: 'joining' },
        { status: ParticipantStatus.NotSignedIn, expected: 'not_signed_in' },
        { status: ParticipantStatus.UnableToJoin, expected: 'unable_to_join' },
        { status: ParticipantStatus.None, expected: 'not_signed_in' }
    ];

    participantStatusCssTestCases.forEach(test => {
        it(`should return class ${test.expected} when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatusCss(pat)).toBe(test.expected);
        });
    });
});
