import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { ConfigService } from 'src/app/services/api/config.service';
import { ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list.component';

describe('JudgeParticipantStatusListComponent', () => {
    let component: JudgeParticipantStatusListComponent;
    let fixture: ComponentFixture<JudgeParticipantStatusListComponent>;
    let adalService: MockAdalService;
    let eventService: MockEventsService;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [JudgeParticipantStatusListComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService }
            ]
        });
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
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

    it('should return true when participant is available', () => {
        const availableParticipant = component.conference.participants.find(x => x.status === ParticipantStatus.Available);
        expect(component.isParticipantAvailable(availableParticipant)).toBeTruthy();
    });

    it('should return false when participant is not available', () => {
        const availableParticipant = component.conference.participants.find(x => x.status !== ParticipantStatus.Available);
        expect(component.isParticipantAvailable(availableParticipant)).toBeFalsy();
    });

    it('should return unavailable text for all non-available statuses', () => {
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Disconnected }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InConsultation }))).toBe(
            'Unavailable'
        );
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InHearing }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Joining }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.NotSignedIn }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.UnableToJoin }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.None }))).toBe('Unavailable');
    });

    it('should return available text for when participant is available', () => {
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Available }))).toBe('Available');
    });

    it('should not be able to call participant is user is judge', () => {
        const judge = component.conference.participants.find(x => x.role === Role.Judge);
        adalService.userInfo.userName = judge.username;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'chris.green@hearings.net' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
});
