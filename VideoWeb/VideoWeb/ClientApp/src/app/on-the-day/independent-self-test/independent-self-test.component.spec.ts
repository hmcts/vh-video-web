import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { IndependentSelfTestComponent } from './independent-self-test.component';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { By } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { MockComponent, MockPipe } from 'ng-mocks';
import { ContactUsFoldingComponent } from 'src/app/shared/contact-us-folding/contact-us-folding.component';
import { SelfTestActionsComponent } from '../self-test-actions/self-test-actions.component';

describe('IndependentSelfTestComponent', () => {
    let fixture: ComponentFixture<IndependentSelfTestComponent>;
    let component: IndependentSelfTestComponent;

    let mockStore: MockStore<ConferenceState>;
    let selfTestComponent: SelfTestV2Component;
    let router: jasmine.SpyObj<Router>;

    let logger: Logger;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    });

    beforeEach(async () => {
        mockStore = createMockStore({
            initialState: {
                currentConference: undefined,
                loggedInParticipant: undefined,
                countdownComplete: false,
                availableRooms: []
            }
        });

        await TestBed.configureTestingModule({
            declarations: [
                IndependentSelfTestComponent,
                MockComponent(SelfTestV2Component),
                MockComponent(SelfTestActionsComponent),
                MockComponent(ContactUsFoldingComponent),
                MockPipe(TranslatePipe)
            ],
            providers: [{ provide: Logger, useValue: new MockLogger() }, { provide: Router, useValue: router }, provideMockStore()]
        }).compileComponents;

        fixture = TestBed.createComponent(IndependentSelfTestComponent);
        component = fixture.componentInstance;

        mockStore = TestBed.inject(MockStore);
        logger = TestBed.inject(Logger);

        selfTestComponent = fixture.debugElement.query(By.directive(SelfTestV2Component)).componentInstance;

        fixture.detectChanges();
    });

    afterEach(() => {
        mockStore.resetSelectors();
    });

    describe('equipmentWorksHandler', () => {
        it('should navigate to staff member hearing list if staff member', () => {
            component.isStaffMember = true;
            component.equipmentWorksHandler();

            expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.StaffMemberHearingList);
        });

        it('should navigate to participant hearing list if not staff member', () => {
            component.isStaffMember = false;
            component.equipmentWorksHandler();

            expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.ParticipantHearingList);
        });
    });

    describe('equipmentFaultyHandler', () => {
        it('should show equipment fault message and hide self test', () => {
            component.equipmentFaultyHandler();

            expect(component.showEquipmentFaultMessage).toBeTrue();
            expect(component.testInProgress).toBeFalse();
        });
    });

    describe('restartTest', () => {
        it('should set testInProgress to false and hideSelfTest to false', () => {
            component.testInProgress = true;
            component.restartTest();

            expect(component.testInProgress).toBeFalse();
            expect(component.showEquipmentFaultMessage).toBeFalse();
        });
    });
});
