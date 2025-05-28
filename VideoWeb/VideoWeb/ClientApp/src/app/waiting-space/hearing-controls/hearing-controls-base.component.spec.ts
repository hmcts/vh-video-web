import { fakeAsync, flush } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { browsers } from 'src/app/shared/browser.constants';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import {
    onScreenshareConnectedMock,
    onScreenshareStoppedMock,
    onVideoEvidenceSharedMock,
    onVideoEvidenceStoppedMock,
    videoCallServiceSpy
} from 'src/app/testing/mocks/mock-video-call.service';
import { HearingRole } from '../models/hearing-role-model';
import { PrivateConsultationRoomControlsComponent } from '../private-consultation-room-controls/private-consultation-room-controls.component';
import { HearingControlsBaseComponent } from './hearing-controls-base.component';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceSetting } from 'src/app/shared/models/conference-setting';
import { ConferenceState, initialState as initialConferenceState } from '../store/reducers/conference.reducer';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { take } from 'rxjs/operators';
import { NotificationToastrService } from '../services/notification-toastr.service';

import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { LocalDeviceStatus, VHConference, VHParticipant, VHPexipParticipant, VHRoom } from '../store/models/vh-conference';
import { VideoCallActions } from '../store/actions/video-call.action';
import { ConnectedScreenshare, StoppedScreenshare } from '../models/video-call-models';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';

describe('HearingControlsBaseComponent', () => {
    let component: HearingControlsBaseComponent;
    let mockStore: MockStore<ConferenceState>;
    const globalConference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailPast());
    const globalParticipant = globalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;

    const videoCallService = videoCallServiceSpy;
    const translateService = translateServiceSpy;

    const dynamicScreenShareStartedSubject = onVideoEvidenceSharedMock;
    const dynamicScreenShareStoppedSubject = onVideoEvidenceStoppedMock;
    const onScreenshareConnectedSubject = onScreenshareConnectedMock;
    const onScreenshareStoppedSubject = onScreenshareStoppedMock;

    const deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', ['isDesktop', 'getBrowserName']);

    const logger: Logger = new MockLogger();
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const focusService = jasmine.createSpyObj<FocusService>(['restoreFocus', 'storeFocus']);

    let conference: VHConference;

    let isAudioOnlySubject: Subject<boolean>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    let notificationToastrServiceSpy: jasmine.SpyObj<NotificationToastrService>;

    beforeEach(() => {
        const initialState = initialConferenceState;
        globalParticipant.pexipInfo = {
            isRemoteMuted: false,
            isSpotlighted: false,
            isVideoMuted: false,
            handRaised: false,
            pexipDisplayName: `${globalParticipant.id}_John Doe`,
            uuid: '1922_John Doe',
            callTag: 'john-cal-tag'
        } as VHPexipParticipant;
        mockStore = createMockStore({ initialState });

        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, globalParticipant);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, globalConference);
        translateService.instant.calls.reset();
        focusService.storeFocus.calls.reset();

        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['getConferenceSetting', 'checkCameraAndMicrophonePresence'],
            ['isAudioOnly$']
        );
        userMediaServiceSpy.getConferenceSetting.and.returnValue(null);
        userMediaServiceSpy.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: true, hasAMicrophone: true }));
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.wowzaKillButton, false).and.returnValue(of(true));
        notificationToastrServiceSpy = jasmine.createSpyObj('NotificationToastrService', ['showError']);

        component = new PrivateConsultationRoomControlsComponent(
            videoCallService,
            eventsService,
            deviceTypeService,
            logger,
            translateService,
            userMediaServiceSpy,
            launchDarklyServiceSpy,
            focusService,
            mockStore,
            notificationToastrServiceSpy
        );
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailNow());
        component.participant = globalParticipant;
        component.conferenceId = globalConference.id;
        component.isPrivateConsultation = false;
        component.setupVideoCallSubscribers();
        component.sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);
        component.sessionStorage.set(true);
    });

    afterEach(() => {
        component.ngOnDestroy();
        mockStore.resetSelectors();
    });

    describe('toggleHandRaised', () => {
        describe('hand raised', () => {
            beforeEach(() => {
                component.handRaised = true;
            });

            it('should return hand raised text when hand is raised', () => {
                expect(component.handToggleText).toBe('hearing-controls.lower-my-hand');
            });

            it('should dispatch lower hand action when toggling hand', () => {
                const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
                component.toggleHandRaised();
                expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.lowerHand());
            });
        });

        describe('hand not raised', () => {
            beforeEach(() => {
                component.handRaised = false;
            });

            it('should return hand raised text when hand is raised', () => {
                expect(component.handToggleText).toBe('hearing-controls.raise-my-hand');
            });

            it('should dispatch raise hand action when toggling hand', () => {
                const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
                component.toggleHandRaised();
                expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.raiseHand());
            });
        });
    });

    describe('toggleVideo', () => {
        describe('video muted', () => {
            beforeEach(() => {
                component.videoMuted = true;
            });

            it('should return video muted text when video is muted', () => {
                expect(component.videoMutedText).toBe('hearing-controls.switch-camera-on');
            });

            it('should dispatch toggle video action when toggling video', () => {
                const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
                component.toggleVideoMute();
                expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.toggleOutgoingVideo());
            });
        });

        describe('video no muted', () => {
            beforeEach(() => {
                component.videoMuted = false;
            });

            it('should return video muted text when video is muted', () => {
                expect(component.videoMutedText).toBe('hearing-controls.switch-camera-off');
            });

            it('should dispatch toggle video action when toggling video', () => {
                const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
                component.toggleVideoMute();
                expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.toggleOutgoingVideo());
            });
        });
    });

    describe('toggleMute', () => {
        it('should dispatch toggle mute action when toggling audio', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.toggleMute();
            expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.toggleAudioMute());
        });
    });

    describe('isHost', () => {
        it('should return true for staff member', () => {
            component.participant = conference.participants.find(x => x.role === Role.StaffMember);
            expect(component.isHost).toBe(true);
        });
        it('should return true for judge', () => {
            component.participant = conference.participants.find(x => x.role === Role.Judge);
            expect(component.isHost).toBe(true);
        });
        it('should return false for individual', () => {
            component.participant = conference.participants.find(x => x.role === Role.Individual);
            expect(component.isHost).toBe(false);
        });
    });

    describe('updateControlBooleans', () => {
        it('should update a participant when the store publishes a new value', fakeAsync(() => {
            const participant = component.participant;
            const updatedPexipInfo: VHPexipParticipant = {
                ...participant.pexipInfo,
                isRemoteMuted: true,
                isSpotlighted: true,
                handRaised: true
            };
            const updatedMediatStatus: LocalDeviceStatus = { ...participant.localMediaStatus, isMicrophoneMuted: true, isCameraOff: true };
            const updatedParticipant: VHParticipant = {
                ...component.participant,
                pexipInfo: updatedPexipInfo,
                localMediaStatus: updatedMediatStatus
            };

            component.updateControlBooleans(updatedParticipant);

            expect(component.remoteMuted).toBeTrue();
            expect(component.handRaised).toBeTrue();
            expect(component.audioMuted).toBeTrue();
            expect(component.videoMuted).toBeTrue();
            expect(component.isSpotlighted).toBeTrue();
        }));
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

        it('should stop screen share when sharingDynamicEvidence is false and screenshare has been stopped', () => {
            component.sharingDynamicEvidence = false;

            component.stopScreenShare();

            expect(videoCallService.stopScreenShare).toHaveBeenCalled();
        });
    });

    describe('Screen Share Connected', () => {
        it('should set screenshare stream on connected', () => {
            // Arrange
            const stream = <any>{};
            const payload = new ConnectedScreenshare(stream);

            // Act
            onScreenshareConnectedSubject.next(payload);

            // Assert
            expect(component.screenShareStream).toBe(stream);
        });
    });

    describe('Screen Share Disconnected', () => {
        it('should set screenshare stream to null on disconnected', () => {
            // Arrange
            component.screenShareStream = <any>{};
            const payload = new StoppedScreenshare('reason');

            // Act
            onScreenshareStoppedSubject.next(payload);

            // Assert
            expect(component.screenShareStream).toBe(null);
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

    describe('toggleView', () => {
        it('should show self view on-click when currently hidden', () => {
            component.selfViewOpen = false;
            component.toggleView();
            expect(component.selfViewOpen).toBeTruthy();
        });

        it('should hide self view on-click when currently visible', () => {
            component.selfViewOpen = true;
            component.toggleView();
            expect(component.selfViewOpen).toBeFalsy();
        });
    });

    describe('displayConfirmationLeaveHearingDialog', () => {
        it('should display the leave hearing popup', () => {
            component.displayLeaveHearingPopup = false;
            component.displayConfirmationLeaveHearingDialog();
            expect(component.displayLeaveHearingPopup).toBeTruthy();
        });
    });

    describe('lockPrivateConsultation', () => {
        it('should emit the request to lock the private consultation', () => {
            const emitted = spyOn(component.lockConsultation, 'emit');
            component.lockPrivateConsultation(true);
            expect(emitted).toHaveBeenCalledWith(true);
        });
    });

    describe('togglePanelStatus', () => {
        it('should emit the request to toggle the panel status', () => {
            const emitted = spyOn(component.togglePanel, 'emit');
            component.togglePanelStatus('Chat');
            expect(emitted).toHaveBeenCalledWith('Chat');
        });
    });

    describe('startScreenShare', () => {
        it('should set select and start on startScreenShare', async () => {
            // Act
            await component.startScreenShare();

            // Assert
            expect(videoCallService.selectScreen).toHaveBeenCalledTimes(1);
            expect(videoCallService.startScreenShare).toHaveBeenCalledTimes(1);
        });
    });

    it('should pause the hearing', () => {
        const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
        component.pause();
        expect(dispatchSpy).toHaveBeenCalledWith(VideoCallHostActions.pauseHearing({ conferenceId: component.conferenceId }));
    });

    it('should display confirm close hearing popup', () => {
        component.displayConfirmPopup = false;
        component.displayConfirmationDialog();
        expect(component.displayConfirmPopup).toBeTruthy();
    });

    describe('Close hearing', () => {
        it('should not close the hearing on keep hearing open', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.displayConfirmPopup = true;
            component.close(false);
            expect(component.displayConfirmPopup).toBeFalsy();
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('should close the hearing on close hearing', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.displayConfirmPopup = true;
            component.close(true);
            expect(component.displayConfirmPopup).toBeFalsy();
            expect(dispatchSpy).toHaveBeenCalledWith(VideoCallHostActions.endHearing({ conferenceId: component.conferenceId }));
            expect(component.sessionStorage.get()).toBeNull();
        });

        it('should close the hearing', () => {
            const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.close(true);
            expect(dispatchSpy).toHaveBeenCalledWith(VideoCallHostActions.endHearing({ conferenceId: component.conferenceId }));
            expect(component.sessionStorage.get()).toBeNull();
        });
    });

    describe('isJudge', () => {
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
    });

    describe('isJOHRoom', () => {
        it('should return true when the participant room starts with JudgeJOH', () => {
            component.participant.room = { label: 'JudgeJOH' } as VHRoom;
            expect(component.isJOHRoom).toBeTruthy();
        });

        it('should return false when the participant room does not start with JudgeJOH', () => {
            component.participant.room = { label: 'Participant' } as VHRoom;
            expect(component.isJOHRoom).toBeFalsy();
        });
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
                component.participant.hearingRole = hearingRole;
                component.ngOnInit();
                expect(component.canShowScreenShareButton).toBeTruthy();
            });
        });

        const nonAllowedHearingRoles = [HearingRole.OBSERVER];
        nonAllowedHearingRoles.forEach(hearingRole => {
            it(`returns "false" when device is a desktop device and user has the '${hearingRole}' HearingRole`, () => {
                deviceTypeService.isDesktop.and.returnValue(true);
                component.participant.hearingRole = hearingRole;
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
        let dispatchSpy: jasmine.Spy;
        beforeEach(() => {
            dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.participant.role = Role.Judge;
        });

        it('should not display the leave hearing popup', () => {
            component.displayLeaveHearingPopup = true;
            component.leave(false, []);
            expect(component.displayLeaveHearingPopup).toBeFalsy();
        });

        it('should not make any api calls if confirmation was cancelled', () => {
            component.leave(false, []);
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('should dismiss participant if confirmed leaving and another host is present', () => {
            component.displayLeaveHearingPopup = true;
            const participantsModel = [];
            spyOn(component, 'isAnotherHostInHearing').and.returnValue(true);

            component.leave(true, participantsModel);

            expect(dispatchSpy).toHaveBeenCalledWith(
                VideoCallHostActions.hostLeaveHearing({ conferenceId: component.conferenceId, participantId: component.participant.id })
            );
        });

        it('should suspend the hearing if confirmed leaving and another host is not present', () => {
            spyOn(component, 'isAnotherHostInHearing').and.returnValue(false);

            component.leave(true, []);

            expect(dispatchSpy).toHaveBeenCalledWith(VideoCallHostActions.suspendHearing({ conferenceId: component.conferenceId }));
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
        let dispatchSpy: jasmine.Spy;

        beforeEach(() => {
            dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();
            component.participant.role = Role.Individual;
        });

        it('should not display the leave hearing popup', () => {
            component.displayLeaveHearingPopup = true;
            component.nonHostLeave(false);
            expect(component.displayLeaveHearingPopup).toBeFalsy();
            expect(dispatchSpy).not.toHaveBeenCalled();
        });

        it('should dismiss participant if confirmed leaving', done => {
            component.displayLeaveHearingPopup = true;

            component.nonHostLeave(true);

            mockStore.scannedActions$.pipe(take(1)).subscribe(action => {
                expect(action).toEqual(
                    VideoCallActions.participantLeaveHearingRoom({
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
            const participants: VHParticipant[] = [
                {
                    id: '1234',
                    role: Role.Individual,
                    hearingRole: HearingRole.LITIGANT_IN_PERSON,
                    status: ParticipantStatus.Available
                } as VHParticipant
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeFalse();
        });

        it('returns false if there is no other host, judge status not in hearing', () => {
            const participants: VHParticipant[] = [
                { id: '1234', role: Role.Judge, hearingRole: HearingRole.JUDGE, status: ParticipantStatus.Available } as VHParticipant
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeFalse();
        });

        it('returns true if another host is in hearing, staff', () => {
            const participants: VHParticipant[] = [
                { id: '1234', role: Role.Judge, hearingRole: HearingRole.JUDGE, status: ParticipantStatus.Available } as VHParticipant,
                {
                    id: '2344',
                    role: Role.StaffMember,
                    hearingRole: HearingRole.STAFF_MEMBER,
                    status: ParticipantStatus.InHearing
                } as VHParticipant
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeTrue();
        });

        it('returns true if another host is in hearing, judge', () => {
            const participants: VHParticipant[] = [
                { id: '1234', role: Role.Judge, hearingRole: HearingRole.JUDGE, status: ParticipantStatus.InHearing } as VHParticipant,
                {
                    id: '2344',
                    role: Role.StaffMember,
                    hearingRole: HearingRole.STAFF_MEMBER,
                    status: ParticipantStatus.Available
                } as VHParticipant
            ];

            const isAnotherHostInHearing = component.isAnotherHostInHearing(participants);

            expect(isAnotherHostInHearing).toBeTrue();
        });
    });

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

    describe('isObserver', () => {
        it('should return true when participant role is QuickLinkObserver', () => {
            component.participant = { role: Role.QuickLinkObserver } as VHParticipant;
            expect(component.isObserver).toBeTrue();
        });

        it('should return false when participant role is not QuickLinkObserver', () => {
            component.participant = { role: Role.Judge } as VHParticipant;
            expect(component.isObserver).toBeFalse();
        });

        it('should return false when participant is undefined', () => {
            component.participant = undefined;
            expect(component.isObserver).toBeFalse();
        });
    });

    describe('isInterpreter', () => {
        it('should return true when participant hearing role is Interpreter', () => {
            component.participant = { hearingRole: HearingRole.INTERPRETER } as VHParticipant;
            expect(component.isInterpreter).toBeTrue();
        });

        it('should return false when participant hearing role is not Interpreter', () => {
            component.participant = { hearingRole: HearingRole.JUDGE } as VHParticipant;
            expect(component.isInterpreter).toBeFalse();
        });

        it('should return false when participant is undefined', () => {
            component.participant = undefined;
            expect(component.isInterpreter).toBeFalse();
        });
    });

    describe('roomLocked', () => {
        it('should return true when room is locked', () => {
            component.participant.room = { locked: true } as VHRoom;
            expect(component.roomLocked).toBeTrue();
        });

        it('should return false when room is not locked', () => {
            component.participant.room = { locked: false } as VHRoom;
            expect(component.roomLocked).toBeFalse();
        });

        it('should return false when room is undefined', () => {
            component.participant.room = undefined;
            expect(component.roomLocked).toBeFalse();
        });

        it('should return false when participant is undefined', () => {
            component.participant = undefined;
            expect(component.roomLocked).toBeFalse();
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

    describe('dialout', () => {
        it('should display popup when onDialOutClicked', () => {
            component.displayDialOutPopup = false;

            component.onDialOutClicked();

            expect(focusService.storeFocus).toHaveBeenCalled();
            expect(component.displayDialOutPopup).toBeTrue();
        });

        it('should hide popup when closeDialOutPopup', () => {
            component.displayDialOutPopup = true;

            component.closeDialOutPopup();

            expect(focusService.restoreFocus).toHaveBeenCalled();
            expect(component.displayDialOutPopup).toBeFalse();
        });
    });
});
