import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AudioRecordingState, VHConference, VHParticipant } from '../models/vh-conference';
import { ConferenceState } from '../reducers/conference.reducer';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';

import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { EventsService } from 'src/app/services/events.service';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { AudioRecordingEffects } from './audio-recording.effects';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { getActiveConference, getAudioRecordingState, getLoggedInParticipant } from '../selectors/conference.selectors';
import { ConferenceActions } from '../actions/conference.actions';
import { cold, hot } from 'jasmine-marbles';
import { AudioRecordingActions } from '../actions/audio-recording.actions';
import { ActiveToast } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

fdescribe('AudioRecordingEffects', () => {
    const testData = new ConferenceTestData();
    let vhConference: VHConference;
    let judge: VHParticipant;

    let actions$: Observable<any>;
    let effects: AudioRecordingEffects;
    let mockConferenceStore: MockStore<ConferenceState>;
    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let notificationToastrService: jasmine.SpyObj<NotificationToastrService>;

    beforeEach(() => {
        vhConference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        vhConference.audioRecordingRequired = true;

        judge = vhConference.participants.find(p => p.role === Role.Judge);
        judge.status = ParticipantStatus.InHearing;

        audioRecordingService = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', [
            'reconnectToWowza',
            'stopRecording',
            'cleanupDialOutConnections'
        ]);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['sendAudioRestartActioned']);
        notificationToastrService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', [
            'showAudioRecordingErrorWithRestart',
            'showAudioRecordingRestartFailure',
            'showAudioRecordingRestartSuccess'
        ]);

        TestBed.configureTestingModule({
            providers: [
                AudioRecordingEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: Logger, useValue: new MockLogger() },
                { provide: AudioRecordingService, useValue: audioRecordingService },
                { provide: EventsService, useValue: eventsService },
                { provide: NotificationToastrService, useValue: notificationToastrService }
            ]
        });

        effects = TestBed.inject(AudioRecordingEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('verifyAudioRecordingOnCountdownComplete$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should dispatch a verification failed action if verification fails - judge', () => {
            // Arrange
            const audioRecordingState = {
                continueWithoutRecording: false,
                restartNotificationDisplayed: false,
                wowzaConnectedAsAudioOnly: false,
                recordingPaused: false,
                restartInProgress: false
            } as AudioRecordingState;

            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            mockConferenceStore.overrideSelector(getAudioRecordingState, audioRecordingState);

            // Act
            const action = ConferenceActions.countdownComplete({
                conferenceId: vhConference.id
            });
            const expectedAction = AudioRecordingActions.audioRecordingVerificationFailed({
                conferenceId: vhConference.id
            });

            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            // Assert
            expect(effects.verifyAudioRecordingOnCountdownComplete$).toBeObservable(expected);
        });

        it('should dispatch a verification failed action if verification fails - staff member', () => {
            // Arrange
            const audioRecordingState = {
                continueWithoutRecording: false,
                restartNotificationDisplayed: false,
                wowzaConnectedAsAudioOnly: false,
                recordingPaused: false,
                restartInProgress: false
            } as AudioRecordingState;

            judge.role = Role.StaffMember;

            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            mockConferenceStore.overrideSelector(getAudioRecordingState, audioRecordingState);

            // Act
            const action = ConferenceActions.countdownComplete({
                conferenceId: vhConference.id
            });
            const expectedAction = AudioRecordingActions.audioRecordingVerificationFailed({
                conferenceId: vhConference.id
            });

            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            // Assert
            expect(effects.verifyAudioRecordingOnCountdownComplete$).toBeObservable(expected);
        });

        it('should not dispatch when verification passes', () => {
            // Arrange
            const audioRecordingState = {
                continueWithoutRecording: false,
                restartNotificationDisplayed: false,
                wowzaConnectedAsAudioOnly: true,
                recordingPaused: false,
                restartInProgress: false
            } as AudioRecordingState;

            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            mockConferenceStore.overrideSelector(getAudioRecordingState, audioRecordingState);

            // Act
            const action = ConferenceActions.countdownComplete({
                conferenceId: vhConference.id
            });

            actions$ = hot('-a', { a: action });
            const expected = cold('-');

            // Assert
            expect(effects.verifyAudioRecordingOnCountdownComplete$).toBeObservable(expected);
        });
    });

    describe('displayRestartRecordingNotification$', () => {
        it('should display restart notification when audio verification fails - judge', () => {
            // Arrange
            vhConference.countdownComplete = true;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            const mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showAudioRecordingErrorWithRestart.and.returnValue(mockToast);

            // Act
            const action = AudioRecordingActions.audioRecordingVerificationFailed({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.displayRestartRecordingNotification$.subscribe(() => {
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
                expect(effects.restartToastNotification).toBeDefined();
            });
        });

        it('should display restart notification when audio verification fails - Staff Member', () => {
            // Arrange
            vhConference.countdownComplete = true;
            judge.role = Role.StaffMember;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            const mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showAudioRecordingErrorWithRestart.and.returnValue(mockToast);

            // Act
            const action = AudioRecordingActions.audioRecordingVerificationFailed({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.displayRestartRecordingNotification$.subscribe(() => {
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
                expect(effects.restartToastNotification).toBeDefined();
            });
        });
    });

    describe('removeRestartRecordingNotification$', () => {
        it('should clear the restart notification when a restart is in progress', () => {
            // Arrange
            const mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            effects.restartToastNotification = mockToast;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);

            // Act
            const action = AudioRecordingActions.audioRecordingRestarted({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.removeRestartRecordingNotification$.subscribe(() => {
                expect(mockToast.remove).toHaveBeenCalled();
                expect(effects.restartToastNotification).toBeNull();
            });
        });
    });

    describe('pauseAudioRecording$', () => {
        it('should pause audio recording when requested by a judge', () => {
            // Arrange
            vhConference.countdownComplete = true;
            const audioRecordingState = {
                continueWithoutRecording: false,
                restartNotificationDisplayed: false,
                wowzaConnectedAsAudioOnly: true,
                recordingPaused: false,
                restartInProgress: false
            } as AudioRecordingState;

            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            mockConferenceStore.overrideSelector(getAudioRecordingState, audioRecordingState);

            audioRecordingService.stopRecording.and.returnValue(Promise.resolve());

            // Act
            const action = AudioRecordingActions.pauseAudioRecording({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.pauseAudioRecording$.subscribe(() => {
                expect(audioRecordingService.stopRecording).toHaveBeenCalled();
            });
        });

        it('should pause audio recording when requested by a staff member', () => {
            // Arrange
            vhConference.countdownComplete = true;
            judge.role = Role.StaffMember;
            const audioRecordingState = {
                continueWithoutRecording: false,
                restartNotificationDisplayed: false,
                wowzaConnectedAsAudioOnly: true,
                recordingPaused: false,
                restartInProgress: false
            } as AudioRecordingState;

            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            mockConferenceStore.overrideSelector(getAudioRecordingState, audioRecordingState);

            audioRecordingService.stopRecording.and.returnValue(Promise.resolve());

            // Act
            const action = AudioRecordingActions.pauseAudioRecording({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.pauseAudioRecording$.subscribe(() => {
                expect(audioRecordingService.stopRecording).toHaveBeenCalled();
            });
        });
    });

    describe('displayResumeFailureRecordingNotification$', () => {
        it('should display audio restart failure notification to judge in a hearing', () => {
            // Arrange
            vhConference.countdownComplete = true;
            judge.status = ParticipantStatus.InHearing;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            const mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showAudioRecordingRestartFailure.and.returnValue(mockToast);

            // Act
            const action = AudioRecordingActions.resumeAudioRecordingFailure({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.displayResumeFailureRecordingNotification$.subscribe(() => {
                expect(notificationToastrService.showAudioRecordingRestartFailure).toHaveBeenCalled();
                expect(effects.restartFailureToastNotification).toBeDefined();
            });
        });
    });

    describe('displayResumeSuccessRecordingNotification$', () => {
        it('should display audio restart success notification to judge in a hearing', () => {
            // Arrange
            vhConference.countdownComplete = true;
            judge.status = ParticipantStatus.InHearing;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, judge);
            const mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showAudioRecordingRestartSuccess.and.returnValue(mockToast);

            // Act
            const action = AudioRecordingActions.resumeAudioRecordingSuccess({
                conferenceId: vhConference.id
            });
            actions$ = of(action);

            // Assert
            effects.displayResumeSuccessRecordingNotification$.subscribe(() => {
                expect(notificationToastrService.showAudioRecordingRestartSuccess).toHaveBeenCalled();
                expect(effects.restartSuccessToastNotification).toBeDefined();
            });
        });
    });
});
