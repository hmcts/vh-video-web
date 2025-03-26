import { Store } from '@ngrx/store';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { BaseSelfTestComponentDirective } from './base-self-test.component';
import { Component } from '@angular/core';
import { Role, TestScore } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { SelfTestScore, VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { MockComponent } from 'ng-mocks';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';
import { UserProfile } from 'src/app/waiting-space/store/models/user-profile';

@Component({
    standalone: false,
    selector: 'app-test-self-test',
    template: ` <app-self-test-v2></app-self-test-v2> `
})
class STTestComponent extends BaseSelfTestComponentDirective {
    constructor(
        protected conferenceStore: Store<ConferenceState>,
        protected logger: Logger
    ) {
        super(conferenceStore, logger);
    }
}

describe('BaseSelfTestComponentDirective', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;
    let userProfile: UserProfile;

    let fixture: ComponentFixture<BaseSelfTestComponentDirective>;
    let component: BaseSelfTestComponentDirective;
    let mockStore: MockStore<ConferenceState>;

    const mockLogger = new MockLogger();

    beforeAll(() => {
        conference = mapConferenceToVHConference(testData.getConferenceDetailFuture());
        loggedInParticipant = conference.participants.find(x => x.role === Role.Individual);
    });

    beforeEach(async () => {
        userProfile = {
            roles: [Role.Individual]
        };
        mockStore = createMockStore({
            initialState: {
                currentConference: conference,
                loggedInParticipant: loggedInParticipant,
                countdownComplete: false,
                availableRooms: []
            }
        });

        await TestBed.configureTestingModule({
            declarations: [STTestComponent, MockComponent(SelfTestV2Component)],
            providers: [{ provide: Logger, useValue: mockLogger }, provideMockStore()]
        }).compileComponents();

        fixture = TestBed.createComponent(STTestComponent); // Create the test component
        component = fixture.componentInstance; // Get the component instance

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
        mockStore.overrideSelector(ConferenceSelectors.getUserProfile, userProfile);

        fixture.detectChanges();
    });

    describe('ngOnInit', () => {
        it('should setup for individual', () => {
            expect(component.isStaffMember).toBeFalse();
            expect(component.conference).toBe(conference);
            expect(component.participant).toBe(loggedInParticipant);
            expect(component.testInProgress).toBeFalse();
        });

        it('should capture self test score', () => {
            const selfTestScore: SelfTestScore = { score: TestScore.Good, passed: true };
            mockStore.overrideSelector(ConferenceSelectors.getSelfTestScore, selfTestScore);

            mockStore.refreshState();
            expect(component.selfTestScore).toBe(selfTestScore);
            expect(component.selfTestCompleted).toBeTrue();
        });

        it('should setup for staff member', () => {
            userProfile = { ...userProfile, roles: [Role.StaffMember] };
            mockStore.overrideSelector(ConferenceSelectors.getUserProfile, userProfile);

            mockStore.refreshState();
            expect(component.isStaffMember).toBeTrue();
        });
    });

    describe('onTestStarted', () => {
        it('should set testInProgress to true', () => {
            component.testInProgress = false;
            component.onTestStarted();
            expect(component.testInProgress).toBeTrue();
        });
    });

    describe('restartTest', () => {
        it('should set testInProgress to false ', () => {
            component.testInProgress = true;
            component.restartTest();
            expect(component.testInProgress).toBeFalse();
        });
    });

    describe('onSelfTestCompleted', () => {
        it('should set testInProgress to false', () => {
            component.testInProgress = true;
            component.onSelfTestCompleted();
            expect(component.testInProgress).toBeFalse();
        });
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });
});
