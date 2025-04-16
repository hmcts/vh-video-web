import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitForHearingPanelComponent } from './wait-for-hearing-panel.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { NonHostUserRole } from '../waiting-room-shared/models/non-host-user-role';

describe('WaitForHearingPanelComponent', () => {
    let component: WaitForHearingPanelComponent;
    let fixture: ComponentFixture<WaitForHearingPanelComponent>;

    function createTestHearing() {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        const conference = mapConferenceToVHConference(conferenceResponse);
        return new VHHearing(conference);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaitForHearingPanelComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WaitForHearingPanelComponent);
        component = fixture.componentInstance;
        component.hearing = createTestHearing();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getCurrentTimeClass', () => {
        describe('is a participant, not a witness or witness link', () => {
            beforeEach(() => {
                component.userRole = NonHostUserRole.Participant;
                component.isWitnessOrHasWitnessLink = false;
            });
            it('should return hearing-on-time when conference is onTime', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
            });

            it('should return hearing-on-time when conference is paused', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(false);
                spyOn(component.hearing, 'isPaused').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
            });

            it('should return hearing-on-time when conference is closed', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(false);
                spyOn(component.hearing, 'isPaused').and.returnValue(false);
                spyOn(component.hearing, 'isClosed').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
            });

            it('should return hearing-near-start when conference is due to begin', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(false);
                spyOn(component.hearing, 'isPaused').and.returnValue(false);
                spyOn(component.hearing, 'isClosed').and.returnValue(false);
                spyOn(component.hearing, 'isStarting').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
            });

            it('should return hearing-neart-start when conference is inSession', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(false);
                spyOn(component.hearing, 'isPaused').and.returnValue(false);
                spyOn(component.hearing, 'isClosed').and.returnValue(false);
                spyOn(component.hearing, 'isStarting').and.returnValue(false);
                spyOn(component.hearing, 'isInSession').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
            });

            it('should return hearing-delayed when conference is delayed', () => {
                spyOn(component.hearing, 'isOnTime').and.returnValue(false);
                spyOn(component.hearing, 'isPaused').and.returnValue(false);
                spyOn(component.hearing, 'isClosed').and.returnValue(false);
                spyOn(component.hearing, 'isStarting').and.returnValue(false);
                spyOn(component.hearing, 'isInSession').and.returnValue(false);
                spyOn(component.hearing, 'isDelayed').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
            });
        });

        describe('is a participant, is a witness or has a witness link', () => {
            beforeEach(() => {
                component.userRole = NonHostUserRole.Participant;
                component.isWitnessOrHasWitnessLink = true;
            });

            it('should return hearing-delayed when conference is suspended', () => {
                spyOn(component.hearing, 'isSuspended').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
            });

            it('should return hearing-near-start when conference is InSession', () => {
                spyOn(component.hearing, 'isSuspended').and.returnValue(false);
                spyOn(component.hearing, 'isInSession').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
            });

            it('should return hearing-on-time when is not in session', () => {
                spyOn(component.hearing, 'isInSession').and.returnValue(false);
                expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
            });
        });

        describe('is a joh', () => {
            beforeEach(() => {
                component.userRole = NonHostUserRole.Joh;
            });

            it('should return hearing-delayed when conference is suspended', () => {
                spyOn(component.hearing, 'isSuspended').and.returnValue(true);
                expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
            });

            it('should return hearing-on-time when conference is not suspended', () => {
                spyOn(component.hearing, 'isSuspended').and.returnValue(false);
                expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
            });
        });
    });

    describe('isJoh', () => {
        it('should return true when user role is joh', () => {
            component.userRole = NonHostUserRole.Joh;
            expect(component.isJoh).toBe(true);
        });

        it('should return false when user role is not joh', () => {
            component.userRole = NonHostUserRole.Participant;
            expect(component.isJoh).toBe(false);
        });
    });

    describe('isParticipant', () => {
        it('should return true when user role is participant', () => {
            component.userRole = NonHostUserRole.Participant;
            expect(component.isParticipant).toBe(true);
        });

        it('should return false when user role is not participant', () => {
            component.userRole = NonHostUserRole.Joh;
            expect(component.isParticipant).toBe(false);
        });
    });
});
