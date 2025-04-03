import { Router, ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { JudgeSelfTestComponent } from './judge-self-test.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { videoWebService, errorService, activatedRoute } from 'src/app/waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { UserProfile } from 'src/app/waiting-space/store/models/user-profile';
import { By } from '@angular/platform-browser';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { TranslatePipe } from '@ngx-translate/core';
import { MockComponent, MockPipe } from 'ng-mocks';
import { ContactUsFoldingComponent } from 'src/app/shared/contact-us-folding/contact-us-folding.component';
import { SelfTestActionsComponent } from '../self-test-actions/self-test-actions.component';

describe('JudgeSelfTestComponent', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;
    let userProfile: UserProfile;
    let mockStore: MockStore<ConferenceState>;

    let fixture: ComponentFixture<JudgeSelfTestComponent>;
    let component: JudgeSelfTestComponent;

    let selfTestComponent: SelfTestV2Component;
    let router: jasmine.SpyObj<Router>;

    let logger: Logger;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    });

    beforeEach(() => {
        conference = mapConferenceToVHConference(testData.getConferenceDetailFuture());
        loggedInParticipant = conference.participants.find(x => x.role === Role.Individual);
        userProfile = {
            displayName: loggedInParticipant.displayName,
            firstName: loggedInParticipant.firstName,
            lastName: loggedInParticipant.lastName,
            username: loggedInParticipant.username,
            name: loggedInParticipant.name,
            roles: [Role.Judge]
        };

        mockStore = createMockStore({
            initialState: {
                currentConference: conference,
                loggedInParticipant: loggedInParticipant,
                userProfile: userProfile,
                countdownComplete: false,
                availableRooms: []
            }
        });
        router.navigateByUrl.calls.reset();

        TestBed.configureTestingModule({
            declarations: [
                JudgeSelfTestComponent,
                MockComponent(SelfTestV2Component),
                MockComponent(SelfTestActionsComponent),
                MockComponent(ContactUsFoldingComponent),
                MockPipe(TranslatePipe)
            ],
            providers: [
                { provide: Logger, useValue: new MockLogger() },
                { provide: Router, useValue: router },
                { provide: VideoWebService, useValue: videoWebService },
                { provide: ErrorService, useValue: errorService },
                { provide: ActivatedRoute, useValue: activatedRoute },
                provideMockStore()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(JudgeSelfTestComponent);
        component = fixture.componentInstance;

        mockStore = TestBed.inject(MockStore);
        logger = TestBed.inject(Logger);

        selfTestComponent = fixture.debugElement.query(By.directive(SelfTestV2Component)).componentInstance;

        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
        mockStore.overrideSelector(ConferenceSelectors.getUserProfile, userProfile);

        fixture.detectChanges();
    });

    describe('equipmentWorksHandler', () => {
        it('should navigate to judge hearing list', () => {
            component.equipmentWorksHandler();

            expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.JudgeHearingList);
        });
    });

    describe('equipmentFaultyHandler', () => {
        it('should show equipment fault message', () => {
            component.showEquipmentFaultMessage = false;
            component.testInProgress = true;

            component.equipmentFaultyHandler();

            expect(component.showEquipmentFaultMessage).toBeTrue();
            expect(component.testInProgress).toBeFalse();
        });
    });

    describe('restartTest', () => {
        it('should restart the test', () => {
            component.showEquipmentFaultMessage = true;

            component.restartTest();

            expect(component.showEquipmentFaultMessage).toBeFalse();
        });
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });
});
