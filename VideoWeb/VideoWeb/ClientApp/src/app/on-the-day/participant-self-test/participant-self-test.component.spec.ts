import { Role, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ParticipantSelfTestComponent } from './participant-self-test.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { Router } from '@angular/router';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { MockComponent, MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestActions } from 'src/app/waiting-space/store/actions/self-test.actions';
import { By } from '@angular/platform-browser';
import { ContactUsFoldingComponent } from 'src/app/shared/contact-us-folding/contact-us-folding.component';

describe('ParticipantSelfTestV2Component', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;
    let mockStore: MockStore<ConferenceState>;

    let fixture: ComponentFixture<ParticipantSelfTestComponent>;
    let component: ParticipantSelfTestComponent;

    let selfTestComponent: SelfTestV2Component;

    let logger: Logger;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    beforeAll(() => {
        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(async () => {
        conference = mapConferenceToVHConference(testData.getConferenceDetailFuture());
        loggedInParticipant = conference.participants.find(x => x.role === Role.Individual);

        mockStore = createMockStore({
            initialState: {
                currentConference: conference,
                loggedInParticipant: loggedInParticipant,
                countdownComplete: false,
                availableRooms: []
            }
        });

        await TestBed.configureTestingModule({
            declarations: [
                ParticipantSelfTestComponent,
                MockComponent(SelfTestV2Component),
                MockComponent(ContactUsFoldingComponent),
                MockPipe(TranslatePipe)
            ],
            providers: [
                { provide: Logger, useValue: new MockLogger() },
                { provide: Router, useValue: router },
                { provide: ParticipantStatusUpdateService, useValue: participantStatusUpdateService },
                provideMockStore()
            ]
        }).compileComponents;

        fixture = TestBed.createComponent(ParticipantSelfTestComponent);
        component = fixture.componentInstance;

        mockStore = TestBed.inject(MockStore);
        logger = TestBed.inject(Logger);

        selfTestComponent = fixture.debugElement.query(By.directive(SelfTestV2Component)).componentInstance;

        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

        fixture.detectChanges();
    });

    describe('onSelfTestCompleted', () => {
        it('should set self test completed to true', () => {
            component.onSelfTestCompleted();
            expect(component.selfTestCompleted).toBeTruthy();
            expect(component.continueClicked).toBeFalse();
        });
    });

    describe('continueParticipantJourney', () => {
        it('should ignore if continue has already been clicked', () => {
            component.continueClicked = true;
            component.continueParticipantJourney();
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should navigate to camera working screen if self-test is completed', () => {
            component.selfTestCompleted = true;
            component.continueParticipantJourney();

            expect(component.selfTestCompleted).toBeTrue();
            expect(component.continueClicked).toBeTrue();
            expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
        });

        it('should raise self test incompleted event if user continues before completing a self-test', () => {
            component.selfTestCompleted = false;
            component.continueClicked = false;
            const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();

            component.continueParticipantJourney();

            expect(component.continueClicked).toBeTrue();
            expect(dispatchSpy).toHaveBeenCalledWith(
                SelfTestActions.publishSelfTestFailure({
                    conferenceId: conference.id,
                    reason: SelfTestFailureReason.IncompleteTest
                })
            );
        });
    });

    describe('restartTest', () => {
        it('should restart the self-test', () => {
            spyOn(selfTestComponent, 'startTestCall');
            component.restartTest();

            expect(component.continueClicked).toBeFalse();
            expect(selfTestComponent.startTestCall).toHaveBeenCalled();
        });
    });

    describe('beforeunloadHandler', () => {
        it('should raise not signed in event', async () => {
            const event = { returnValue: 'save' };
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

            component.beforeunloadHandler(event);
            await fixture.whenStable();
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalled();
        });

        it('should log error if unable to update status', fakeAsync(() => {
            const event = { returnValue: 'save' };
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.reject());
            const logSpy = spyOn(logger, 'error');

            component.beforeunloadHandler(event);
            tick();
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalled();
        }));
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });
});
