import { Guid } from 'guid-typescript';
import { ConferenceStatus, HearingLayout, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallTestData } from 'src/app/testing/mocks/data/video-call-test-data';
import {
    eventsServiceSpy,
    hearingCountdownCompleteSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import {
    onParticipantUpdatedMock,
    onScreenshareConnectedMock,
    onScreenshareStoppedMock,
    videoCallServiceSpy
} from 'src/app/testing/mocks/mock-video-call.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ConnectedScreenshare, ParticipantUpdated, StoppedScreenshare } from '../models/video-call-models';
import { deviceTypeService } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { PrivateConsultationRoomControlsComponent } from './private-consultation-room-controls.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { of, Subject } from 'rxjs';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState, initialState as initialConferenceState } from '../store/reducers/conference.reducer';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { audioRecordingServiceSpy } from '../../testing/mocks/mock-audio-recording.service';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { VHPexipParticipant, VHRoom } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { JoinConsultationDecider } from './models/join-consultation-decider';

describe('PrivateConsultationRoomControlsComponent', () => {
    let component: PrivateConsultationRoomControlsComponent;
    let mockStore: MockStore<ConferenceState>;
    const gloalConference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailPast());
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;
    let notificationToastrServiceSpy: jasmine.SpyObj<NotificationToastrService>;
    const videoCallService = videoCallServiceSpy;
    const onParticipantUpdatedSubject = onParticipantUpdatedMock;
    const onScreenshareConnectedSubject = onScreenshareConnectedMock;
    const onScreenshareStoppedSubject = onScreenshareStoppedMock;

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
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, gloalConference);

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
            audioRecordingServiceSpy,
            notificationToastrServiceSpy
        );
        component.participant = globalParticipant;
        component.conferenceId = gloalConference.id;
        component.setupEventhubSubscribers();
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

    describe('joinHearingFromConsultation', () => {
        it('should call videoCallService.joinHearingInSession', fakeAsync(() => {
            // Act
            component.joinHearingFromConsultation();
            flush();

            // Assert
            expect(videoCallServiceSpy.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
        }));
    });

    it('should open self-view by default for judge', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Judge);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should mute non-judge by default', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(videoCallService.toggleMute).toHaveBeenCalled();
    });

    it('should open self-view by default for non judge participants', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should raise hand on toggle if hand not raised', () => {
        videoCallService.raiseHand.calls.reset();
        component.handRaised = false;
        component.toggleHandRaised();
        expect(videoCallService.raiseHand).toHaveBeenCalledTimes(1);
        const expectedText = 'hearing-controls.lower-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should lower hand on toggle if hand raised', () => {
        videoCallService.lowerHand.calls.reset();
        component.handRaised = true;
        component.toggleHandRaised();
        expect(videoCallService.lowerHand).toHaveBeenCalledTimes(1);
        const expectedText = 'hearing-controls.raise-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should switch camera on if camera is off', async () => {
        videoCallService.toggleVideo.calls.reset();
        videoCallService.toggleVideo.and.returnValue(false);
        component.videoMuted = true;
        eventsService.sendMediaStatus.calls.reset();

        await component.toggleVideoMute();

        expect(videoCallService.toggleVideo).toHaveBeenCalledTimes(1);
        expect(component.videoMuted).toBeFalsy();
        const expectedText = 'hearing-controls.switch-camera-off';
        expect(component.videoMutedText).toBe(expectedText);
        expect(eventsService.sendMediaStatus).toHaveBeenCalledTimes(1);
    });

    it('should switch camera off if camera is on', async () => {
        videoCallService.toggleVideo.calls.reset();
        videoCallService.toggleVideo.and.returnValue(true);
        component.videoMuted = false;

        await component.toggleVideoMute();

        expect(videoCallService.toggleVideo).toHaveBeenCalledTimes(1);
        expect(component.videoMuted).toBeTruthy();
        const expectedText = 'hearing-controls.switch-camera-on';
        expect(component.videoMutedText).toBe(expectedText);
    });

    it('should show raised hand on hand lowered', () => {
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.pexipInfo.pexipDisplayName);
        pexipParticipant.buzz_time = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'hearing-controls.raise-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should not show raised hand on hand lowered for another participant', () => {
        const otherParticipant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        otherParticipant.pexipInfo = {
            handRaised: false
        } as VHPexipParticipant;
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(otherParticipant.pexipInfo.pexipDisplayName);
        pexipParticipant.is_muted = 'YES';
        pexipParticipant.buzz_time = 0;
        pexipParticipant.spotlight = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.handRaised = true;
        component.remoteMuted = false;
        onParticipantUpdatedSubject.next(payload);
        expect(component.remoteMuted).toBeFalsy();
        expect(component.handRaised).toBeTruthy();
        const expectedText = 'hearing-controls.lower-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should show lower hand on hand raised', () => {
        globalParticipant.pexipInfo.handRaised = true;
        component.participant = globalParticipant;
        const expectedText = 'hearing-controls.lower-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should not show lower hand when hand raised for another participant', () => {
        const otherParticipant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        otherParticipant.pexipInfo = {
            handRaised: false
        } as VHPexipParticipant;
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(otherParticipant.pexipInfo.pexipDisplayName);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        component.handRaised = false;
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'hearing-controls.raise-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should not reset mute when participant status to available', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.displayName, gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should reset mute when participant status to in consultation', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, participant.displayName, gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalled();
    });

    it('should ignore participant updates for another participant', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        const message = new ParticipantStatusMessage(participant.id, participant.displayName, gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should show self view on-click when currently hidden', async () => {
        component.selfViewOpen = false;
        await component.toggleView();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should hide self view on-click when currently visible', async () => {
        component.selfViewOpen = true;
        await component.toggleView();
        expect(component.selfViewOpen).toBeFalsy();
    });

    it('should mute the participant when user opts to mute the call', async () => {
        videoCallService.toggleMute.and.returnValue(true);
        await component.toggleMute();
        expect(component.audioMuted).toBeTruthy();
    });

    it('should unmute the participant when user opts to turn off mute option', async () => {
        videoCallService.toggleMute.and.returnValue(false);
        await component.toggleMute();
        expect(component.audioMuted).toBeFalsy();
    });

    it('should unmute the participant already muted', async () => {
        spyOn(component, 'toggleMute').and.callThrough();
        videoCallService.toggleMute.and.returnValue(false);
        component.audioMuted = true;
        await component.resetMute();
        expect(videoCallService.toggleMute).toHaveBeenCalled();
        expect(component.toggleMute).toHaveBeenCalled();
        expect(component.audioMuted).toBeFalsy();
    });

    it('should not reset mute option the participant not in mute', () => {
        spyOn(component, 'toggleMute').and.callThrough();
        component.audioMuted = false;
        component.resetMute();
        expect(component.toggleMute).toHaveBeenCalledTimes(0);
        expect(component.audioMuted).toBeFalsy();
    });

    it('should pause the hearing', () => {
        component.pause();
        expect(videoCallService.pauseHearing).toHaveBeenCalledWith(component.conferenceId);
    });

    it('should display confirm close hearing popup', () => {
        component.displayConfirmPopup = false;
        component.displayConfirmationDialog();
        expect(component.displayConfirmPopup).toBeTruthy();
    });

    it('should not close the hearing on keep hearing open', async () => {
        videoCallService.endHearing.calls.reset();
        component.displayConfirmPopup = true;
        component.close(false);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(videoCallService.endHearing).toHaveBeenCalledTimes(0);
    });

    it('should close the hearing on close hearing', async () => {
        component.displayConfirmPopup = true;
        component.close(true);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(videoCallService.endHearing).toHaveBeenCalledWith(component.conferenceId);
    });

    it('should close the hearing', () => {
        component.close(true);
        expect(videoCallService.endHearing).toHaveBeenCalledWith(component.conferenceId);
    });

    it('should return true when partipant is judge', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Judge);
        expect(component.isJudge).toBeTruthy();
    });

    it('should return false when partipant is an individual', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        expect(component.isJudge).toBeFalsy();
    });

    it('should return false when partipant is a representative', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Representative);
        expect(component.isJudge).toBeFalsy();
    });

    it('should reset mute on countdown complete for judge', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = gloalConference.participants.filter(x => x.role === Role.Judge)[0];

        hearingCountdownCompleteSubjectMock.next(gloalConference.id);

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should not reset mute on countdown complete for another hearing', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = gloalConference.participants.filter(x => x.role === Role.Judge)[0];

        hearingCountdownCompleteSubjectMock.next(Guid.create().toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should not reset mute on countdown complete for another hearing', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

        hearingCountdownCompleteSubjectMock.next(globalParticipant.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should make sure non-judge participants are muted after countdown is complete', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.audioMuted = false;
        videoCallService.toggleMute.calls.reset();

        hearingCountdownCompleteSubjectMock.next(gloalConference.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should publish media device status for non-judge participants who are already muted after countdown is complete', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.audioMuted = true;
        videoCallService.toggleMute.calls.reset();
        eventsService.sendMediaStatus.calls.reset();

        hearingCountdownCompleteSubjectMock.next(gloalConference.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
        expect(eventsService.sendMediaStatus).toHaveBeenCalledTimes(1);
    });

    it('should emit when leave button has been clicked', () => {
        spyOn(component.leaveConsultation, 'emit');
        component.leavePrivateConsultation();
        expect(component.leaveConsultation.emit).toHaveBeenCalled();
    });

    it('should set screenshare stream on connected', () => {
        // Arrange
        const stream = <any>{};
        const payload = new ConnectedScreenshare(stream);

        // Act
        onScreenshareConnectedSubject.next(payload);

        // Assert
        expect(component.screenShareStream).toBe(stream);
    });

    it('should set screenshare stream to null on disconnected', () => {
        // Arrange
        component.screenShareStream = <any>{};
        const payload = new StoppedScreenshare('reason');

        // Act
        onScreenshareStoppedSubject.next(payload);

        // Assert
        expect(component.screenShareStream).toBe(null);
    });

    it('should set select and start on startScreenShare', async () => {
        // Act
        await component.startScreenShare();

        // Assert
        expect(videoCallService.selectScreen).toHaveBeenCalledTimes(1);
        expect(videoCallService.startScreenShare).toHaveBeenCalledTimes(1);
    });

    it('should call stopScreenShare on stopScreenShare', async () => {
        // Act
        await component.stopScreenShare();

        // Assert
        expect(videoCallService.stopScreenShare).toHaveBeenCalledTimes(1);
    });
    it('should confirm that the consultation room is a judge and JOH court room', async () => {
        component.participant = globalParticipant;
        component.participant.room = { label: 'JudgeJOHCourtRoom' } as VHRoom;

        expect(component.isJOHRoom).toBe(true);
    });
    it('should confirm that the consultation room is not a judge and JOH court room', async () => {
        component.participant = globalParticipant;
        component.participant.room = { label: 'ParticipantCourtRoom' } as VHRoom;

        expect(component.isJOHRoom).toBe(false);
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

        const testCases = [
            { key: 'Available', value: ParticipantStatus.Available },
            { key: 'In Consultation', value: ParticipantStatus.InConsultation },
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
                const result = component.canCloseOrPauseHearing();

                // Assert
                expect(result).toBeFalse();
            });
        }
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

    describe('Pause Resume Audio Recording', () => {
        beforeEach(() => {
            audioRecordingServiceSpy.stopRecording.calls.reset();
            audioRecordingServiceSpy.reconnectToWowza.calls.reset();
            component.recordingButtonDisabled = false;
        });

        describe('when recording button disabled', () => {
            it('should not call audioRecordingService.pauseRecording', () => {
                component.recordingButtonDisabled = true;
                component.pauseRecording();
                expect(audioRecordingServiceSpy.stopRecording).toHaveBeenCalledTimes(0);
            });

            it('should call audioRecordingService.resumeRecording', () => {
                component.recordingButtonDisabled = true;
                component.resumeRecording();
                expect(audioRecordingServiceSpy.reconnectToWowza).toHaveBeenCalledTimes(0);
            });
        });

        describe('when recording button enabled', () => {
            it('should call audioRecordingService.pauseRecording', fakeAsync(() => {
                component.pauseRecording();
                expect(audioRecordingServiceSpy.stopRecording).toHaveBeenCalled();
                expect(component.recordingButtonDisabled).toBeTrue();
                tick(5000);
                expect(component.recordingButtonDisabled).toBeFalse();
            }));

            it('should call audioRecordingService.resumeRecording', fakeAsync(() => {
                component.resumeRecording();
                expect(audioRecordingServiceSpy.reconnectToWowza).toHaveBeenCalled();
                expect(component.recordingButtonDisabled).toBeTrue();
                tick(5000);
                expect(component.recordingButtonDisabled).toBeFalse();
            }));
        });
    });
});
