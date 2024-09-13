import {fakeAsync, flush, tick} from '@angular/core/testing';
import {Guid} from 'guid-typescript';
import {BehaviorSubject, Observable, of, Subject, Subscription} from 'rxjs';
import {
    ClientSettingsResponse,
    ConferenceResponse,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import {ParticipantService} from 'src/app/services/conference/participant.service';
import {DeviceTypeService} from 'src/app/services/device-type.service';
import {Logger} from 'src/app/services/logging/logger-base';
import {ParticipantStatusMessage} from 'src/app/services/models/participant-status-message';
import {UserMediaService} from 'src/app/services/user-media.service';
import {browsers} from 'src/app/shared/browser.constants';
import {getSpiedPropertyGetter} from 'src/app/shared/jasmine-helpers/property-helpers';
import {ParticipantModel} from 'src/app/shared/models/participant';
import {ParticipantHandRaisedMessage} from 'src/app/shared/models/participant-hand-raised-message';
import {ParticipantRemoteMuteMessage} from 'src/app/shared/models/participant-remote-mute-message';
import {ConferenceTestData} from 'src/app/testing/mocks/data/conference-test-data';
import {VideoCallTestData} from 'src/app/testing/mocks/data/video-call-test-data';
import {
    eventsServiceSpy,
    hearingCountdownCompleteSubjectMock,
    participantHandRaisedStatusSubjectMock,
    participantRemoteMuteStatusSubjectMock,
    participantStatusSubjectMock,
    participantToggleLocalMuteSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import {MockLogger} from 'src/app/testing/mocks/mock-logger';
import {translateServiceSpy} from 'src/app/testing/mocks/mock-translation.service';
import {
    onParticipantUpdatedMock,
    onVideoEvidenceSharedMock,
    onVideoEvidenceStoppedMock,
    videoCallServiceSpy
} from 'src/app/testing/mocks/mock-video-call.service';
import {HearingRole} from '../models/hearing-role-model';
import {ParticipantUpdated} from '../models/video-call-models';
import {
    PrivateConsultationRoomControlsComponent
} from '../private-consultation-room-controls/private-consultation-room-controls.component';
import {HearingControlsBaseComponent} from './hearing-controls-base.component';
import {ConferenceService} from 'src/app/services/conference/conference.service';
import {ConferenceStatusChanged} from 'src/app/services/conference/models/conference-status-changed.model';
import {ConfigService} from 'src/app/services/api/config.service';
import {VideoControlService} from '../../services/conference/video-control.service';
import {VideoControlCacheService} from '../../services/conference/video-control-cache.service';
import {SessionStorage} from 'src/app/services/session-storage';
import {VhoStorageKeys} from 'src/app/vh-officer/services/models/session-keys';
import {ParticipantToggleLocalMuteMessage} from 'src/app/shared/models/participant-toggle-local-mute-message';
import {FEATURE_FLAGS, LaunchDarklyService} from '../../services/launch-darkly.service';
import {FocusService} from 'src/app/services/focus.service';
import {ConferenceSetting} from 'src/app/shared/models/conference-setting';
import {ConferenceState, initialState as initialConferenceState} from '../store/reducers/conference.reducer';
import {createMockStore, MockStore} from '@ngrx/store/testing';
import {ConferenceActions} from '../store/actions/conference.actions';
import {take} from 'rxjs/operators';

describe('HearingControlsBaseComponent', () => {
    const participantOneId = Guid.create().toString();
    const participantOne = new ParticipantForUserResponse({
        id: participantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpreter',
        role: Role.Individual,
        representee: null,
        tiled_display_name: `CIVILIAN;Interpreter;${participantOneId}`,
        hearing_role: HearingRole.INTERPRETER,
        first_name: 'Interpreter',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    let component: HearingControlsBaseComponent;
    let mockStore: MockStore<ConferenceState>;
    const globalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = globalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;

    const videoCallService = videoCallServiceSpy;
    const onParticipantUpdatedSubject = onParticipantUpdatedMock;
    const translateService = translateServiceSpy;

    const dynamicScreenShareStartedSubject = onVideoEvidenceSharedMock;
    const dynamicScreenShareStoppedSubject = onVideoEvidenceStoppedMock;

    const deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', ['isDesktop', 'getBrowserName']);

    const logger: Logger = new MockLogger();
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const focusService = jasmine.createSpyObj<FocusService>(['restoreFocus', 'storeFocus']);

    let conference: ConferenceResponse;

    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;

    let isAudioOnlySubject: Subject<boolean>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let onCurrentConferenceStatusSubject: Subject<ConferenceStatusChanged>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let clientSettingsResponse: ClientSettingsResponse;
    let videoControlServiceSpy: jasmine.SpyObj<VideoControlService>;
    let videoControlCacheSpy: jasmine.SpyObj<VideoControlCacheService>;

    beforeEach(() => {
        const initialState = initialConferenceState;
        mockStore = createMockStore({ initialState });

        clientSettingsResponse = new ClientSettingsResponse({
            enable_dynamic_evidence_sharing: false
        });
        translateService.instant.calls.reset();
        focusService.storeFocus.calls.reset();

        participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
            'ParticipantService',
            [],
            ['loggedInParticipant$', 'onParticipantSpotlightStatusChanged$']
        );

        videoControlServiceSpy = jasmine.createSpyObj<VideoControlService>('VideoControlService', [
            'setSpotlightStatus',
            'setSpotlightStatusById',
            'setRemoteMuteStatusById',
            'setHandRaiseStatusById'
        ]);

        videoControlCacheSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', ['setHandRaiseStatus']);

        const loggedInParticipantSubject = new BehaviorSubject<ParticipantModel>(
            ParticipantModel.fromParticipantForUserResponse(participantOne)
        );
        getSpiedPropertyGetter(participantServiceSpy, 'loggedInParticipant$').and.returnValue(loggedInParticipantSubject.asObservable());

        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['getConferenceSetting', 'checkCameraAndMicrophonePresence'],
            ['isAudioOnly$']
        );
        userMediaServiceSpy.getConferenceSetting.and.returnValue(null);
        userMediaServiceSpy.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: true, hasAMicrophone: true }));
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>([], ['onCurrentConferenceStatusChanged$']);
        onCurrentConferenceStatusSubject = new Subject<ConferenceStatusChanged>();
        getSpiedPropertyGetter(conferenceServiceSpy, 'onCurrentConferenceStatusChanged$').and.returnValue(onCurrentConferenceStatusSubject);

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));

        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.wowzaKillButton, false).and.returnValue(of(true));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vodafone, false).and.returnValue(of(false));

        component = new PrivateConsultationRoomControlsComponent(
            videoCallService,
            eventsService,
            deviceTypeService,
            logger,
            participantServiceSpy,
            translateService,
            videoControlServiceSpy,
            userMediaServiceSpy,
            conferenceServiceSpy,
            configServiceSpy,
            videoControlCacheSpy,
            launchDarklyServiceSpy,
            focusService,
            mockStore
        );
        conference = new ConferenceTestData().getConferenceNow();
        component.participant = globalParticipant;
        component.conferenceId = globalConference.id;
        component.isPrivateConsultation = false;
        component.setupEventhubSubscribers();
        component.setupVideoCallSubscribers();
        component.sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);
        component.sessionStorage.set(true);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });
    it('should return true for staff member', () => {
        component.participant = conference.participants.find(x => x.role === Role.StaffMember);

        expect(component.isHost).toBe(true);
    });
    it('should return true for judge', () => {
        component.participant = conference.participants.find(x => x.role === Role.Judge);

        expect(component.isHost).toBe(true);
    });
    it('should return true for individual', () => {
        component.participant = conference.participants.find(x => x.role === Role.Individual);

        expect(component.isHost).toBe(false);
    });

    describe('on audio only changed', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        describe('when changed to true', () => {
            it('should set audio only to true', fakeAsync(() => {
                // Act
                isAudioOnlySubject.next(true);
                flush();

                // Assert
                expect(component.audioOnly).toBeTrue();
            }));

            it('should set video muted to true', fakeAsync(() => {
                // Act
                isAudioOnlySubject.next(true);
                flush();

                // Assert
                expect(component.videoMuted).toBeTrue();
            }));
        });

        describe('when changed to false', () => {
            it('should set audio only to false', fakeAsync(() => {
                // Act
                isAudioOnlySubject.next(false);
                flush();

                // Assert
                expect(component.audioOnly).toBeFalse();
            }));

            it('should set video muted to false', fakeAsync(() => {
                // Act
                isAudioOnlySubject.next(false);
                flush();

                // Assert
                expect(component.videoMuted).toBeFalse();
            }));
        });
    });

    describe('onLoggedInParticipantChanged', () => {
        it('should unsubscribe from the existing subscription and resubscribe', fakeAsync(() => {
            // Arrange
            const firstSubscription = new Subscription();
            spyOn(firstSubscription, 'unsubscribe');
            const secondSubscription = new Subscription();
            spyOn(secondSubscription, 'unsubscribe');
            const observable = new Observable<ParticipantModel>();
            getSpiedPropertyGetter(participantServiceSpy, 'onParticipantSpotlightStatusChanged$').and.returnValue(observable);
            spyOn(observable, 'pipe').and.returnValue(observable);
            spyOn(observable, 'subscribe').and.returnValues(firstSubscription, secondSubscription);

            // Act
            component.onLoggedInParticipantChanged(ParticipantModel.fromParticipantForUserResponse(participantOne));
            flush();
            component.onLoggedInParticipantChanged(ParticipantModel.fromParticipantForUserResponse(participantOne));
            flush();

            // Assert
            expect(firstSubscription.unsubscribe).toHaveBeenCalledTimes(1);
            expect(secondSubscription.unsubscribe).not.toHaveBeenCalledTimes(1);
            expect(component['participantSpotlightUpdateSubscription']).toBe(secondSubscription);
        }));

        it('should update isSpotlighted when spotlight changed event is emitted', fakeAsync(() => {
            // Arrange
            const spotlightChangedSubject = new Subject<ParticipantModel>();
            const spotlightChanged$ = spotlightChangedSubject.asObservable();
            getSpiedPropertyGetter(participantServiceSpy, 'onParticipantSpotlightStatusChanged$').and.returnValue(spotlightChanged$);
            spyOn(spotlightChanged$, 'pipe').and.returnValue(spotlightChanged$);

            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            participant.isSpotlighted = false;

            // Act
            component.onLoggedInParticipantChanged(participant);
            flush();

            participant.isSpotlighted = true;
            spotlightChangedSubject.next(participant);

            // Assert
            expect(component.isSpotlighted).toBeTrue();
        }));

        it('should NOT update isSpotlighted when spotlight changed event is emitted if the participant IDs dont match', fakeAsync(() => {
            // Arrange
            const spotlightChangedSubject = new Subject<ParticipantModel>();
            const spotlightChanged$ = spotlightChangedSubject.asObservable();
            getSpiedPropertyGetter(participantServiceSpy, 'onParticipantSpotlightStatusChanged$').and.returnValue(spotlightChanged$);
            spyOn(spotlightChanged$, 'pipe').and.returnValue(spotlightChanged$);

            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            participant.isSpotlighted = false;

            // Act
            component.onLoggedInParticipantChanged(participant);
            flush();

            participant.id = Guid.create().toString();
            spotlightChangedSubject.next(participant);

            // Assert
            expect(component.isSpotlighted).toBeFalse();
        }));
    });

    describe('onVideoEvidenceSharing', () => {
        it('should set sharingDynamicEvidence to true when video evidence sharing has started', fakeAsync(() => {
            component.sharingDynamicEvidence = false;
            dynamicScreenShareStartedSubject.next();

            flush();

            expect(component.sharingDynamicEvidence).toBeTrue();
        }));

        it('should set sharingDynamicEvidence to false when video evidence sharing has stopped', fakeAsync(() => {
            component.sharingDynamicEvidence = true;
            dynamicScreenShareStoppedSubject.next();

            flush();

            expect(component.sharingDynamicEvidence).toBeFalse();
        }));

        it('should trigger screen with micrphone selection when dynamic evidence sharing is started', async () => {
            await component.startScreenShareWithMicrophone();
            expect(videoCallService.selectScreenWithMicrophone).toHaveBeenCalled();
        });

        it('should stop screen share with micrphone when sharingDynamicEvidence is true and screenshare has been stopped', () => {
            component.sharingDynamicEvidence = true;

            component.stopScreenShare();

            expect(videoCallService.stopScreenWithMicrophone).toHaveBeenCalled();
        });
    });

    describe('handleParticipantToggleLocalMuteChange', () => {
        const eventSubject = participantToggleLocalMuteSubjectMock;

        beforeEach(() => {
            videoCallService.toggleMute.calls.reset();
        });

        describe('message invalid', () => {
            it('should not toggle when the conference id does not match', fakeAsync(() => {
                const message = new ParticipantToggleLocalMuteMessage(Guid.create().toString(), globalParticipant.id, true);
                eventSubject.next(message);
                tick();

                expect(videoCallService.toggleMute).not.toHaveBeenCalled();
            }));

            it('should not toggle when the participant id does not match', fakeAsync(() => {
                const message = new ParticipantToggleLocalMuteMessage(globalConference.id, Guid.create().toString(), true);
                eventSubject.next(message);
                tick();
                expect(videoCallService.toggleMute).not.toHaveBeenCalled();
            }));
        });

        describe('remote mute is on', () => {
            it('should not toggle when the user remote mute is true', fakeAsync(() => {
                component.remoteMuted = true;
                const message = new ParticipantToggleLocalMuteMessage(globalConference.id, globalParticipant.id, true);
                eventSubject.next(message);
                tick();
                expect(videoCallService.toggleMute).not.toHaveBeenCalled();
            }));
        });

        describe('message is valid and remote mute is off', () => {
            beforeEach(() => {
                component.remoteMuted = false;
            });

            it('should toggle mute when locally muted but requested to be unmuted', fakeAsync(() => {
                component.audioMuted = true;
                const message = new ParticipantToggleLocalMuteMessage(globalConference.id, globalParticipant.id, false);
                eventSubject.next(message);
                tick();
                expect(videoCallService.toggleMute).toHaveBeenCalled();
            }));

            it('should toggle mute when locally unmuted but requested to be muted', fakeAsync(() => {
                component.audioMuted = false;
                const message = new ParticipantToggleLocalMuteMessage(globalConference.id, globalParticipant.id, true);
                eventSubject.next(message);
                tick();
                expect(videoCallService.toggleMute).toHaveBeenCalled();
            }));
        });
    });

    it('should open self-view by default for judge', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Judge);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should open self-view by default for non judge participants', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeTruthy();
    });

    it('should mute non-judge by default', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(videoCallService.toggleMute).toHaveBeenCalled();
    });

    it('should ensure participant is unmuted when in a private consultation', () => {
        videoCallService.toggleMute.calls.reset();
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        component.isPrivateConsultation = true;
        component.audioMuted = true;
        component.initialiseMuteStatus();
        expect(videoCallService.toggleMute).toHaveBeenCalled();
    });

    it('should raise hand on toggle if hand not raised', () => {
        component.handRaised = false;
        component.toggleHandRaised();
        expect(videoCallService.raiseHand).toHaveBeenCalledTimes(1);
        const expectedText = 'hearing-controls.lower-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should lower hand on toggle if hand raised', () => {
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
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'hearing-controls.raise-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should show remote muted when muted by host', () => {
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.remoteMuted).toBeTruthy();
    });

    it('should not show raised hand on hand lowered for another participant', () => {
        const otherParticipant = globalConference.participants.filter(x => x.role === Role.Representative)[0];
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(otherParticipant.tiled_display_name);
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

    it('should process hand raised message for participant', () => {
        component.handRaised = false;
        const payload = new ParticipantHandRaisedMessage(globalConference.id, globalParticipant.id, true);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeTruthy();
    });

    it('should process hand lowered message for participant', () => {
        component.handRaised = true;
        const payload = new ParticipantHandRaisedMessage(globalConference.id, globalParticipant.id, false);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeFalsy();
    });

    it('should not process hand raised message for another participant', () => {
        component.handRaised = false;
        const payload = new ParticipantHandRaisedMessage(globalConference.id, Guid.create().toString(), true);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeFalsy();
    });

    it('should process remote mute message for participant', () => {
        component.remoteMuted = false;
        const payload = new ParticipantRemoteMuteMessage(globalConference.id, globalParticipant.id, true);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeTruthy();
    });

    it('should process remote unnmute message for participant', () => {
        component.remoteMuted = true;
        const payload = new ParticipantRemoteMuteMessage(globalConference.id, globalParticipant.id, false);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeFalsy();
    });

    it('should not process remote mute message for another participant', () => {
        component.remoteMuted = false;
        const payload = new ParticipantRemoteMuteMessage(globalConference.id, Guid.create().toString(), true);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeFalsy();
    });

    it('should show lower hand on hand raised', () => {
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeTruthy();
        const expectedText = 'hearing-controls.lower-my-hand';

        expect(component.handToggleText).toBe(expectedText);
    });

    it('should not show lower hand when hand raised for another participant', () => {
        const otherParticipant = globalConference.participants.filter(x => x.role === Role.Representative)[0];
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(otherParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        component.handRaised = false;
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'hearing-controls.raise-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should mute locally if remote muted and not muted locally', () => {
        videoCallService.toggleMute.calls.reset();
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.audioMuted = false;

        component.handleParticipantUpdatedInVideoCall(payload);

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should skip mute locally if remote muted and already muted locally', () => {
        videoCallService.toggleMute.calls.reset();
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.audioMuted = true;
        component.handleParticipantUpdatedInVideoCall(payload);
        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should return false and not toggle mute if pexip display name is undefined', () => {
        videoCallService.toggleMute.calls.reset();
        const payload: ParticipantUpdated = {
            pexipDisplayName: undefined,
            isRemoteMuted: false,
            isSpotlighted: true,
            handRaised: false,
            uuid: undefined,
            isAudioOnlyCall: false,
            isVideoCall: false,
            protocol: '',
            receivingAudioMix: 'main',
            sentAudioMixes: [{ mix_name: 'main', prominent: false }]
        };
        component.audioMuted = true;

        const result = component.handleParticipantUpdatedInVideoCall(payload);

        expect(result).toBeFalsy();
        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should not reset mute when participant status to available', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, '', globalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should reset mute when participant status to in consultation', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalled();
    });

    it('should ignore participant updates for another participant', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalConference.participants.filter(x => x.role === Role.Representative)[0];
        const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);

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
        expect(component.sessionStorage.get()).toBeNull();
    });

    it('should close the hearing', () => {
        component.close(true);
        expect(videoCallService.endHearing).toHaveBeenCalledWith(component.conferenceId);
        expect(component.sessionStorage.get()).toBeNull();
    });

    it('should return true when partipant is judge', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Judge);
        expect(component.isJudge).toBeTruthy();
    });

    it('should return false when partipant is an individual', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        expect(component.isJudge).toBeFalsy();
    });

    it('should return false when partipant is a representative', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Representative);
        expect(component.isJudge).toBeFalsy();
    });

    it('should reset mute on countdown complete for judge', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = globalConference.participants.filter(x => x.role === Role.Judge)[0];

        hearingCountdownCompleteSubjectMock.next(globalConference.id);

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should reset mute on countdown complete for staffmember', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = globalConference.participants.filter(x => x.role === Role.StaffMember)[0];

        hearingCountdownCompleteSubjectMock.next(globalConference.id);

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should not reset mute on countdown complete for another hearing', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = globalConference.participants.filter(x => x.role === Role.Judge)[0];

        hearingCountdownCompleteSubjectMock.next(Guid.create().toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should not reset mute on countdown complete for another hearing', () => {
        videoCallService.toggleMute.calls.reset();
        component.audioMuted = true;
        component.participant = globalConference.participants.filter(x => x.role === Role.Individual)[0];

        hearingCountdownCompleteSubjectMock.next(globalParticipant.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should make sure non-judge participants are muted after countdown is complete', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        component.audioMuted = false;
        videoCallService.toggleMute.calls.reset();

        hearingCountdownCompleteSubjectMock.next(globalConference.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should publish media device status for non-judge participants who are already muted after countdown is complete', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Individual);
        component.audioMuted = true;
        videoCallService.toggleMute.calls.reset();
        eventsService.sendMediaStatus.calls.reset();

        hearingCountdownCompleteSubjectMock.next(globalConference.id.toString());

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
        expect(eventsService.sendMediaStatus).toHaveBeenCalledTimes(1);
    });

    it('should emit when leave button has been clicked', () => {
        spyOn(component.leaveConsultation, 'emit');
        component.leavePrivateConsultation();
        expect(component.leaveConsultation.emit).toHaveBeenCalled();
    });

    it('should indicates that it is the JOH consultation and returns true if participant is JOH or Judge', () => {
        component.participant = globalConference.participants.find(x => x.role === Role.Judge);
        expect(component.isJOHConsultation).toBe(true);
    });

    describe('canShowScreenShareButton()', () => {
        it('returns "false" when device is not desktop', () => {
            deviceTypeService.isDesktop.and.returnValue(false);
            component.ngOnInit();
            expect(component.canShowScreenShareButton).toBe(false);
        });

        it('returns "true" when it is a desktop device', () => {
            deviceTypeService.isDesktop.and.returnValue(true);
            component.ngOnInit();
            expect(component.canShowScreenShareButton).toBe(true);
        });

        it('covers all HearingRole\'s when showing/hiding the "share screen" button', () => {
            const enumCount = Object.keys(HearingRole).length;
            const numberBeingTested = allowedHearingRoles.length + nonAllowedHearingRoles.length + nonAllowedRoles.length;
            expect(numberBeingTested).toBe(enumCount);
        });

        const allowedHearingRoles = [
            HearingRole.APPELLANT,
            HearingRole.APPRAISER,
            HearingRole.DEFENCE_ADVOCATE,
            HearingRole.EXPERT,
            HearingRole.INTERPRETER,
            HearingRole.JUDGE,
            HearingRole.MACKENZIE_FRIEND,
            HearingRole.PANEL_MEMBER,
            HearingRole.PANELMEMBER,
            HearingRole.PROSECUTION,
            HearingRole.PROSECUTION_ADVOCATE,
            HearingRole.REPRESENTATIVE,
            HearingRole.WINGER,
            HearingRole.LITIGANT_IN_PERSON,
            HearingRole.STAFF_MEMBER,
            HearingRole.QUICK_LINK_PARTICIPANT,
            HearingRole.MEDICAL_MEMBER,
            HearingRole.LEGAL_MEMBER,
            HearingRole.DISABILITY_MEMBER,
            HearingRole.FINANCIAL_MEMBER,
            HearingRole.SPECIALIST_LAY_MEMBER,
            HearingRole.LAY_MEMBER,
            HearingRole.WITNESS,
            HearingRole.VICTIM,
            HearingRole.POLICE
        ];
        allowedHearingRoles.forEach(hearingRole => {
            it(`returns "true" when device is a desktop device and user has the '${hearingRole}' HearingRole`, () => {
                deviceTypeService.isDesktop.and.returnValue(true);
                component.participant.hearing_role = hearingRole;
                component.ngOnInit();
                expect(component.canShowScreenShareButton).toBeTruthy();
            });
        });

        const nonAllowedHearingRoles = [HearingRole.OBSERVER];
        nonAllowedHearingRoles.forEach(hearingRole => {
            it(`returns "false" when device is a desktop device and user has the '${hearingRole}' HearingRole`, () => {
                deviceTypeService.isDesktop.and.returnValue(true);
                component.participant.hearing_role = hearingRole;
                component.ngOnInit();
                expect(component.canShowScreenShareButton).toBeFalsy();
            });
        });

        const nonAllowedRoles = [Role.QuickLinkObserver];
        nonAllowedRoles.forEach(role => {
            it(`returns "false" when device is a desktop device and user has the '${role}'Role`, () => {
                deviceTypeService.isDesktop.and.returnValue(true);
                component.participant.role = role;
                component.ngOnInit();
                expect(component.canShowScreenShareButton).toBeFalsy();
            });
        });

        it('returns "false" if user has Observer Case Type Group', () => {
            deviceTypeService.isDesktop.and.returnValue(true);
            component.ngOnInit();
            expect(component.canShowScreenShareButton).toBeFalsy();
        });
    });

    describe('canShowDynamicEvidenceShareButton', () => {
        const testCases = [
            { browserName: browsers.Chrome, expected: true },
            { browserName: browsers.MSEdgeChromium, expected: true },
            { browserName: browsers.Brave, expected: false },
            { browserName: browsers.Firefox, expected: false },
            { browserName: browsers.MSEdge, expected: false },
            { browserName: browsers.Safari, expected: false }
        ];

        testCases.forEach(testcase => {
            it(`should return ${testcase.expected} when browser is ${testcase.browserName}`, () => {
                deviceTypeService.getBrowserName.and.returnValue(testcase.browserName);
                expect(component.canShowDynamicEvidenceShareButton).toBe(testcase.expected);
            });
        });
    });

    it('should emit when change device button has been clicked', () => {
        spyOn(component.changeDeviceToggle, 'emit');
        component.changeDeviceSelected();
        expect(focusService.storeFocus).toHaveBeenCalled();
        expect(component.changeDeviceToggle.emit).toHaveBeenCalled();
    });

    describe('leave', () => {
        beforeEach(() => {
            videoCallService.dismissParticipantFromHearing.calls.reset();
            videoCallService.suspendHearing.calls.reset();
            component.participant.role = Role.Judge;
        });

        it('should not display the leave hearing popup', () => {
            component.displayLeaveHearingPopup = true;
            component.leave(false, []);
            expect(component.displayLeaveHearingPopup).toBeFalsy();
        });

        it('should not make any api calls if confirmation was cancelled', () => {
            component.leave(false, []);
            expect(videoCallService.dismissParticipantFromHearing).not.toHaveBeenCalled();
            expect(videoCallService.suspendHearing).not.toHaveBeenCalled();
        });

        it('should dismiss participant if confirmed leaving and another host is present', done => {
            component.displayLeaveHearingPopup = true;
            const participantsModel = [];
            spyOn(component, 'isAnotherHostInHearing').and.returnValue(true);
            videoCallServiceSpy.leaveHearing.and.returnValue(Promise.resolve());
            component.leaveHearing.subscribe(event => {
                done();
            });

            component.leave(true, participantsModel);

            expect(videoCallService.leaveHearing).toHaveBeenCalledOnceWith(component.conferenceId, component.participant.id);
        });

        it('should suspend the hearing if confirmed leaving and another host is not present', () => {
            spyOn(component, 'isAnotherHostInHearing').and.returnValue(false);

            component.leave(true, []);

            expect(videoCallService.suspendHearing).toHaveBeenCalledOnceWith(component.conferenceId);
        });
    });

    describe('displayLanguageChange', () => {
        it('should emit the change language was selected', () => {
            spyOn(component.changeLanguageSelected, 'emit');
            component.displayLanguageChange();
            expect(component.changeLanguageSelected.emit).toHaveBeenCalled();
        });
    });

    describe('displayLanguageChange', () => {
        it('should emit the change language was selected', () => {
            spyOn(component.changeLanguageSelected, 'emit');
            component.displayLanguageChange();
            expect(component.changeLanguageSelected.emit).toHaveBeenCalled();
        });
    });

    describe('nonHostLeave', () => {
        beforeEach(() => {
            component.participant.role = Role.Individual;
        });

        it('should not display the leave hearing popup', () => {
            component.displayLeaveHearingPopup = true;
            component.nonHostLeave(false);
            expect(component.displayLeaveHearingPopup).toBeFalsy();
            expect(videoCallService.dismissParticipantFromHearing).not.toHaveBeenCalled();
        });

        it('should dismiss participant if confirmed leaving', done => {
            component.displayLeaveHearingPopup = true;

            component.nonHostLeave(true);

            mockStore.scannedActions$.pipe(take(1)).subscribe(action => {
                expect(action).toEqual(
                    ConferenceActions.participantLeaveHearingRoom({
                        conferenceId: component.conferenceId
                    })
                );
                done();
            });
        });
    });

    describe('isAnotherHostInHearing', () => {
        beforeEach(() => {});

        it('returns false if there is no host', () => {
            const participants = [
                new ParticipantModel(
                    '7879c48a-f513-4d3b-bb1b-151831427507',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;7879c48a-f513-4d3b-bb1b-151831427507',
                    Role.Individual,
                    HearingRole.LITIGANT_IN_PERSON,
                    false,
                    null,
                    null,
                    ParticipantStatus.InHearing,
                    null
                )
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeFalse();
        });

        it('returns false if there is no other host, judge status not in hearing', () => {
            const participants = [
                new ParticipantModel(
                    '7879c48a-f513-4d3b-bb1b-151831427507',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;7879c48a-f513-4d3b-bb1b-151831427507',
                    Role.Judge,
                    HearingRole.JUDGE,
                    false,
                    null,
                    null,
                    ParticipantStatus.Available,
                    null
                )
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeFalse();
        });

        it('returns true if another host is in hearing, staff', () => {
            const participants = [
                new ParticipantModel(
                    '7879c48a-f513-4d3b-bb1b-151831427507',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;7879c48a-f513-4d3b-bb1b-151831427507',
                    Role.Judge,
                    null,
                    false,
                    null,
                    null,
                    ParticipantStatus.Available,
                    null
                ),
                new ParticipantModel(
                    '240e3ffb-65e6-45a7-a491-0e60b9524831',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;240e3ffb-65e6-45a7-a491-0e60b9524831',
                    Role.StaffMember,
                    null,
                    false,
                    null,
                    null,
                    ParticipantStatus.InHearing,
                    null
                )
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeTrue();
        });

        it('returns true if another host is in hearing, judge', () => {
            const participants = [
                new ParticipantModel(
                    '7879c48a-f513-4d3b-bb1b-151831427507',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;7879c48a-f513-4d3b-bb1b-151831427507',
                    null,
                    HearingRole.JUDGE,
                    false,
                    null,
                    null,
                    ParticipantStatus.InHearing,
                    null
                ),
                new ParticipantModel(
                    '240e3ffb-65e6-45a7-a491-0e60b9524831',
                    'Participant Name',
                    'DisplayName',
                    'Role;DisplayName;240e3ffb-65e6-45a7-a491-0e60b9524831',
                    Role.StaffMember,
                    null,
                    false,
                    null,
                    null,
                    ParticipantStatus.Available,
                    null
                )
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeTrue();
        });

    });

    it('should send handshake update, when new participant joins', fakeAsync(() => {
        // Arrange
        const participantStatusMessage = new ParticipantStatusMessage(
            'participantId',
            'userName',
            'participantId',
            ParticipantStatus.InHearing
        );
        spyOn(component, 'publishMediaDeviceStatus');
        // act
        component.handleParticipantStatusChange(participantStatusMessage);
        tick(3000);
        // expect
        expect(component.publishMediaDeviceStatus).toHaveBeenCalled();
        expect(eventsService.publishParticipantHandRaisedStatus).toHaveBeenCalled();
    }));

    describe('startWithAudioMuted', () => {
        let conferenceSetting: ConferenceSetting;

        beforeEach(() => {
            conferenceSetting = new ConferenceSetting('conferenceId', true);
            userMediaServiceSpy.getConferenceSetting.and.returnValue(conferenceSetting);
            component.isPrivateConsultation = false;
        });

        it('should return true when conference.startWithAudioMuted is true and not private consultation', () => {
            // Arrange
            conferenceSetting.startWithAudioMuted = true;
            userMediaServiceSpy.getConferenceSetting.and.returnValue(conferenceSetting);
            component.isPrivateConsultation = false;
            // Act
            const value = component.startWithAudioMuted;
            // Assert
            expect(value).toBeTrue();
        });

        it('should return false when conference.startWithAudioMuted is false', () => {
            // Arrange
            conferenceSetting.startWithAudioMuted = false;
            userMediaServiceSpy.getConferenceSetting.and.returnValue(conferenceSetting);
            // Act
            const value = component.startWithAudioMuted;
            // Assert
            expect(value).toBeFalse();
        });

        it('should return false when private consultation', () => {
            // Arrange
            component.isPrivateConsultation = true;
            // Act
            const value = component.startWithAudioMuted;
            // Assert
            expect(value).toBeFalse();
        });
    });

    describe('handleHearingCountdownComplete for host', () => {
        let conferenceSetting: ConferenceSetting;

        beforeEach(() => {
            conferenceSetting = new ConferenceSetting('conferenceId', true);
            component.participant = globalConference.participants.find(x => x.role === Role.Judge);
            component.isPrivateConsultation = false;
            videoCallServiceSpy.toggleMute.calls.reset();
            eventsServiceSpy.sendMediaStatus.calls.reset();
        });

        it('should not unmute audio when host requests to start with audio muted', async () => {
            // Arrange
            conferenceSetting.startWithAudioMuted = true;
            userMediaServiceSpy.getConferenceSetting.and.returnValue(conferenceSetting);
            videoCallServiceSpy.toggleMute.and.returnValue(true);
            // Act
            component.ngOnInit();
            await component.handleHearingCountdownComplete(component.conferenceId);
            // Assert
            expect(videoCallServiceSpy.toggleMute).toHaveBeenCalledTimes(1);
            expect(eventsServiceSpy.sendMediaStatus).toHaveBeenCalledWith(
                jasmine.any(String),
                jasmine.any(String),
                jasmine.objectContaining({ is_local_audio_muted: true })
            );
        });

        it('should unmute audio when host requests to start without audio muted', async () => {
            // Arrange
            conferenceSetting.startWithAudioMuted = false;
            userMediaServiceSpy.getConferenceSetting.and.returnValue(conferenceSetting);
            component.isPrivateConsultation = false;
            // Act
            component.ngOnInit();
            await component.handleHearingCountdownComplete(component.conferenceId);
            // Assert
            expect(videoCallServiceSpy.toggleMute).toHaveBeenCalledTimes(0);
            expect(eventsServiceSpy.sendMediaStatus).toHaveBeenCalledTimes(0);
        });
    });

    describe('isObserver', () => {
        it('should return true when participant role is QuickLinkObserver', () => {
            component.participant = { role: Role.QuickLinkObserver } as ParticipantResponse;
            expect(component.isObserver).toBeTrue();
        });

        it('should return false when participant role is not QuickLinkObserver', () => {
            component.participant = { role: Role.Judge } as ParticipantResponse;
            expect(component.isObserver).toBeFalse();
        });

        it('should return false when participant is undefined', () => {
            component.participant = undefined;
            expect(component.isObserver).toBeFalse();
        });
    });

    describe('changeLayoutDialog', () => {
        it('should store the focus and set the display layout dialog to true', () => {
            component.displayChangeLayoutPopup = false;
            component.displayChangeLayoutDialog();
            expect(focusService.storeFocus).toHaveBeenCalled();
            expect(component.displayChangeLayoutPopup).toBeTrue();
        });

        it('should close the layout dialog and restore the focus', () => {
            component.displayChangeLayoutPopup = true;
            component.closeChangeLayoutDialog();
            expect(focusService.restoreFocus).toHaveBeenCalled();
            expect(component.displayChangeLayoutPopup).toBeFalse();
        });
    });
});
