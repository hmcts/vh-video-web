import { ConferenceStatus, HearingLayout, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { deviceTypeService } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { PrivateConsultationRoomControlsComponent } from './private-consultation-room-controls.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { of, Subject } from 'rxjs';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { fakeAsync, flush } from '@angular/core/testing';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState, initialState as initialConferenceState } from '../store/reducers/conference.reducer';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { VHPexipParticipant } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { JoinConsultationDecider } from './models/join-consultation-decider';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { AudioRecordingActions } from '../store/actions/audio-recording.actions';

describe('PrivateConsultationRoomControlsComponent', () => {
    let component: PrivateConsultationRoomControlsComponent;
    let mockStore: MockStore<ConferenceState>;
    const globalConference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailPast());
    const globalParticipant = globalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    let notificationToastrServiceSpy: jasmine.SpyObj<NotificationToastrService>;
    const videoCallService = videoCallServiceSpy;

    const logger: Logger = new MockLogger();
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['storeFocus', 'restoreFocus']);
    const translateService = translateServiceSpy;

    let isAudioOnlySubject: Subject<boolean>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    beforeAll(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.wowzaKillButton, false).and.returnValue(of(true));
    });
    beforeEach(() => {
        globalParticipant.pexipInfo = {
            isRemoteMuted: false,
            isSpotlighted: false,
            isVideoMuted: false,
            handRaised: false,
            pexipDisplayName: '1922_John Doe',
            uuid: '1922_John Doe',
            callTag: 'john-cal-tag'
        } as VHPexipParticipant;
        const initialState = initialConferenceState;
        mockStore = createMockStore({ initialState });
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, globalConference);

        translateService.instant.calls.reset();

        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['getConferenceSetting', 'checkCameraAndMicrophonePresence'],
            ['isAudioOnly$']
        );
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());
        userMediaServiceSpy.getConferenceSetting.and.returnValue(null);
        userMediaServiceSpy.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: true, hasAMicrophone: true }));

        component = new PrivateConsultationRoomControlsComponent(
            videoCallService,
            eventsService,
            deviceTypeService,
            logger,
            translateService,
            userMediaServiceSpy,
            launchDarklyServiceSpy,
            focusServiceSpy,
            mockStore,
            notificationToastrServiceSpy
        );
        component.participant = globalParticipant;
        component.conferenceId = globalConference.id;
        component.setupVideoCallSubscribers();

        videoCallService.startScreenShare.calls.reset();
        videoCallService.stopScreenShare.calls.reset();
        videoCallService.selectScreen.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    describe('canJoinHearingFromConsultation', () => {
        it('should invoke JoinConsultationDecider.shouldJoinConsultation with correct params', () => {
            const expected = JoinConsultationDecider.shouldJoinConsultation(
                ConferenceStatus.InSession,
                ParticipantStatus.InConsultation,
                true
            );

            component['conferenceStatus'] = ConferenceStatus.InSession;
            component.participant.status = ParticipantStatus.InConsultation;
            spyOnProperty(component, 'isHost').and.returnValue(true);

            const result = component.canJoinHearingFromConsultation;

            expect(result).toBe(expected);
        });
    });

    describe('enableMuteButton', () => {
        it('should be true when countdown is complete', fakeAsync(() => {
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, {
                ...globalConference,
                caseName: 'updated',
                countdownComplete: true
            });
            mockStore.refreshState();

            flush();
            expect(component.enableMuteButton).toBeTrue();
        }));

        it('should be true when in private consultation', fakeAsync(() => {
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, {
                ...globalConference,
                caseName: 'updated',
                countdownComplete: false
            });
            component.isPrivateConsultation = true;

            mockStore.refreshState();

            flush();
            expect(component.enableMuteButton).toBeTrue();
        }));
    });

    describe('joinHearingFromConsultation', () => {
        it('should call videoCallService.joinHearingInSession', fakeAsync(() => {
            // Arrange
            spyOn(mockStore, 'dispatch');
            // Act
            component.joinHearingFromConsultation();
            flush();

            // Assert
            expect(mockStore.dispatch).toHaveBeenCalledOnceWith(
                VideoCallHostActions.joinHearing({ conferenceId: component.conferenceId, participantId: component.participant.id })
            );
        }));
    });

    describe('canCloseOrPauseHearing', () => {
        it('should return true when the participants status is in hearing', () => {
            // Arrange
            component.participant.status = ParticipantStatus.InHearing;

            // Act
            const result = component.canCloseOrPauseHearing();

            // Assert
            expect(result).toBeTrue();
        });
        it('should show close hearing pop when click close button', () => {
            // Arrange
            spyOnProperty(component, 'isHost').and.returnValue(true);
            component.displayConfirmPopup = true;
            component.isPrivateConsultation = false;

            // Assert
            expect(component.isHost).toBeTrue();
            expect(component.canShowCloseHearingPopup).toBeTrue();
        });

        it('should return false when participant is null', () => {
            // Arrange
            component.participant = null;

            // Act
            const result = component.canCloseOrPauseHearing();

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('canLeaveConsultation', () => {
        it('should return true when the participants status is in consultation', () => {
            // Arrange
            component.participant.status = ParticipantStatus.InConsultation;

            // Act
            const result = component.canLeaveConsultation();

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false when participant is null', () => {
            // Arrange
            component.participant = null;

            // Act
            const result = component.canLeaveConsultation();

            // Assert
            expect(result).toBeFalse();
        });

        const testCases = [
            { key: 'Available', value: ParticipantStatus.Available },
            { key: 'In Hearing', value: ParticipantStatus.InHearing },
            { key: 'None', value: ParticipantStatus.None },
            { key: 'Not Signed In', value: ParticipantStatus.NotSignedIn },
            { key: 'Joining', value: ParticipantStatus.Joining },
            { key: 'Unable To Join', value: ParticipantStatus.UnableToJoin },
            { key: 'Disconnected', value: ParticipantStatus.Disconnected }
        ];
        for (const testCase of testCases) {
            it(`should return false when the participants status is ${testCase.key}`, () => {
                // Arrange
                component.participant.status = testCase.value;

                // Act
                const result = component.canLeaveConsultation();

                // Assert
                expect(result).toBeFalse();
            });
        }
    });

    describe('leave', () => {
        describe('host', () => {
            beforeEach(() => {
                component.participant.role = Role.Judge;
            });
            it('should call super leave method with participants', () => {
                const spy = spyOn(HearingControlsBaseComponent.prototype, 'leave');

                component.leave(true);

                expect(spy).toHaveBeenCalledTimes(1);
                expect(spy).toHaveBeenCalledWith(true, component['participants']);
            });
        });

        describe('non-host', () => {
            beforeEach(() => {
                component.participant.role = Role.Individual;
            });
            it('should call super leave method with participants', () => {
                const spy = spyOn(HearingControlsBaseComponent.prototype, 'nonHostLeave');

                component.leave(true);

                expect(spy).toHaveBeenCalledTimes(1);
                expect(spy).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('onLayoutUpdate', () => {
        it('should call video-call service updateCurrentLayout', () => {
            const layout = HearingLayout.Dynamic;
            component.onLayoutUpdate(layout);
            expect(videoCallService.transformLayout).toHaveBeenCalledWith('ac');
        });
    });

    describe('mapLayout', () => {
        it('should return 1:7 when layout is OnePlus7', () => {
            const layout = HearingLayout.OnePlus7;
            const result = component.mapLayout(layout);
            expect(result).toBe('1:7');
        });

        it('should return 2:21 when layout is TwoPlus21', () => {
            const layout = HearingLayout.TwoPlus21;
            const result = component.mapLayout(layout);
            expect(result).toBe('2:21');
        });

        it('should return ac when layout is Dynamic', () => {
            const layout = HearingLayout.Dynamic;
            const result = component.mapLayout(layout);
            expect(result).toBe('ac');
        });

        it('should return 3x3 when layout is NineEqual', () => {
            const layout = HearingLayout.NineEqual;
            const result = component.mapLayout(layout);
            expect(result).toBe('3x3');
        });

        it('should return 4x4 when layout is SixteenEqual', () => {
            const layout = HearingLayout.SixteenEqual;
            const result = component.mapLayout(layout);
            expect(result).toBe('4x4');
        });

        it('should return 5x5 when layout is TwentyFiveEqual', () => {
            const layout = HearingLayout.TwentyFiveEqual;
            const result = component.mapLayout(layout);
            expect(result).toBe('5x5');
        });
    });

    describe('canShowLeaveButton', () => {
        it('should return true when the participant is not in private consultation', () => {
            component.isPrivateConsultation = false;
            expect(component.canShowLeaveButton).toBeTrue();
        });

        it('should return false when the participant is in private consultation', () => {
            component.isPrivateConsultation = true;
            expect(component.canShowLeaveButton).toBeFalse();
        });
    });

    describe('pauseRecording', () => {
        it('should dispatch pauseAudioRecording action', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch');
            component.pauseRecording();
            expect(dispatchSpy).toHaveBeenCalledWith(AudioRecordingActions.pauseAudioRecording({ conferenceId: component.conferenceId }));
        });
    });

    describe('resumeRecording', () => {
        it('should dispatch resumeAudioRecording action', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch');
            component.resumeRecording();
            expect(dispatchSpy).toHaveBeenCalledWith(AudioRecordingActions.resumeAudioRecording({ conferenceId: component.conferenceId }));
        });
    });

    describe('canDisplayChangeLayoutPopup', () => {
        it('should return true when participant is a host', () => {
            spyOnProperty(component, 'isHost').and.returnValue(true);
            component.displayChangeLayoutPopup = true;
            expect(component.canDisplayChangeLayoutPopup).toBeTrue();
        });

        it('should return false when participant is not a host', () => {
            spyOnProperty(component, 'isHost').and.returnValue(false);
            component.displayChangeLayoutPopup = true;
            expect(component.canDisplayChangeLayoutPopup).toBeFalse();
        });
    });
});
