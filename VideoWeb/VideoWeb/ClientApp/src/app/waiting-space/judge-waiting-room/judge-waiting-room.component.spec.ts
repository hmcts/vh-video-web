// import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
// import { ActivatedRoute, convertToParamMap } from '@angular/router';
// import {
//     ConferenceResponse,
//     ConferenceStatus,
//     HearingLayout,
//     LoggedParticipantResponse,
//     ParticipantForUserResponse,
//     ParticipantResponse,
//     ParticipantStatus,
//     Role
// } from 'src/app/services/clients/api-client';
// import { Hearing } from 'src/app/shared/models/hearing';
// import { pageUrls } from 'src/app/shared/page-url.constants';
// import {
//     clockService,
//     consultationInvitiationService,
//     consultationService,
//     deviceTypeService,
//     errorService,
//     eventsService,
//     focusService,
//     globalConference,
//     globalParticipant,
//     hideComponentsService,
//     initAllWRDependencies,
//     logger,
//     mockConferenceStore,
//     notificationSoundsService,
//     notificationToastrService,
//     roomClosingToastrService,
//     router,
//     titleService,
//     videoCallService,
//     launchDarklyService,
//     videoWebService
// } from '../waiting-room-shared/tests/waiting-room-base-setup';
// import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';
// import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
// import { ConsultationInvitation } from '../services/consultation-invitation.service';
// import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
// import { Guid } from 'guid-typescript';
// import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
// import { of, Subject } from 'rxjs';
// import { HearingRole } from '../models/hearing-role-model';
// import { UnloadDetectorService } from 'src/app/services/unload-detector.service';

// import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';
// import { audioRecordingServiceSpy } from '../../testing/mocks/mock-audio-recording.service';

// describe('JudgeWaitingRoomComponent when conference exists', () => {
//     const participantOneId = Guid.create().toString();
//     const participantOne = new ParticipantForUserResponse({
//         id: participantOneId,
//         status: ParticipantStatus.NotSignedIn,
//         display_name: 'Judge',
//         role: Role.Judge,
//         representee: null,
//         tiled_display_name: `CIVILIAN;Judge;${participantOneId}`,
//         hearing_role: HearingRole.JUDGE,
//         first_name: 'Judge',
//         last_name: 'Doe',
//         interpreter_room: null,
//         linked_participants: []
//     });

//     let component: JudgeWaitingRoomComponent;
//     let activatedRoute: ActivatedRoute;
//     let logged: LoggedParticipantResponse;
//     const translateService = translateServiceSpy;
//     let consultationInvitiation: ConsultationInvitation;
//     let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
//     let shouldUnloadSubject: Subject<void>;
//     let shouldReloadSubject: Subject<void>;

//     beforeAll(() => {
//         initAllWRDependencies();
//     });

//     afterAll(() => {
//         mockConferenceStore.resetSelectors();
//     });

//     beforeEach(() => {
//         unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>(
//             'UnloadDetectorService',
//             [],
//             ['shouldUnload', 'shouldReload']
//         );
//         shouldUnloadSubject = new Subject<void>();
//         shouldReloadSubject = new Subject<void>();
//         getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());
//         getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldReload').and.returnValue(shouldReloadSubject.asObservable());

//         consultationInvitiation = {} as ConsultationInvitation;
//         logged = new LoggedParticipantResponse({
//             participant_id: globalParticipant.id,
//             display_name: globalParticipant.display_name,
//             role: globalParticipant.role
//         });
//         activatedRoute = <any>{
//             snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
//         };

//         launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, false).and.returnValue(of(true));

//         component = new JudgeWaitingRoomComponent(
//             activatedRoute,
//             videoWebService,
//             eventsService,
//             logger,
//             errorService,
//             videoCallService,
//             deviceTypeService,
//             router,
//             consultationService,
//             notificationSoundsService,
//             notificationToastrService,
//             roomClosingToastrService,
//             clockService,
//             translateService,
//             consultationInvitiationService,
//             unloadDetectorServiceSpy,
//             titleService,
//             hideComponentsService,
//             focusService,
//             launchDarklyService,
//             mockConferenceStore,
//             audioRecordingServiceSpy
//         );

//         consultationInvitiationService.getInvitation.and.returnValue(consultationInvitiation);

//         const conference = new ConferenceResponse(Object.assign({}, globalConference));
//         const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
//         component.hearing = new Hearing(conference);
//         component.conference = conference;
//         component.participant = participant;
//         component.connected = true; // assume connected to pexip
//         videoWebService.getConferenceById.calls.reset();
//     });

//     afterEach(() => {
//         component.ngOnDestroy();
//         if (component.callbackTimeout) {
//             clearTimeout(component.callbackTimeout);
//         }
//     });

//     const pexipParticipant: PexipParticipant = {
//         buzz_time: 0,
//         call_tag: Guid.create().toString(),
//         display_name: `T1;John Doe;${participantOne.id}`,
//         has_media: true,
//         is_audio_only_call: 'No',
//         is_muted: 'Yes',
//         is_external: false,
//         is_video_call: 'Yes',
//         mute_supported: 'Yes',
//         local_alias: null,
//         start_time: new Date().getTime(),
//         uuid: Guid.create().toString(),
//         spotlight: 0,
//         external_node_uuid: null,
//         protocol: 'webrtc',
//         disconnect_supported: 'Yes',
//         transfer_supported: 'Yes',
//         is_video_silent: false,
//         role: 'GUEST',
//         is_main_video_dropped_out: false,
//         is_video_muted: false,
//         is_streaming_conference: false,
//         send_to_audio_mixes: [{ mix_name: 'main', prominent: false }],
//         receive_from_audio_mix: 'main'
//     };

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should init hearing alert and setup Client', fakeAsync(() => {
//         component.ngOnInit();
//         flushMicrotasks();
//         tick(100);
//         expect(component.eventHubSubscription$).toBeDefined();
//     }));

//     it('should init hearing alert and subscribers', fakeAsync(() => {
//         component.ngOnInit();
//         flushMicrotasks();
//         tick(100);
//         expect(component.eventHubSubscription$).toBeDefined();
//         expect(component.videoCallSubscription$).toBeDefined();
//         expect(videoCallService.setupClient).toHaveBeenCalled();
//     }));

//     const getConferenceStatusTextTestCases = [
//         { status: ConferenceStatus.NotStarted, expected: 'judge-waiting-room.start-this-hearing' },
//         { status: ConferenceStatus.InSession, expected: 'judge-waiting-room.hearing-is-in-session' },
//         { status: ConferenceStatus.Paused, expected: 'judge-waiting-room.hearing-paused' },
//         { status: ConferenceStatus.Suspended, expected: 'judge-waiting-room.hearing-suspended' },
//         { status: ConferenceStatus.Closed, expected: 'judge-waiting-room.hearing-is-closed' }
//     ];

//     getConferenceStatusTextTestCases.forEach(test => {
//         it(`should return hearing status text '${test.expected}'`, () => {
//             component.conference.status = test.status;
//             translateService.instant.calls.reset();
//             expect(component.getConferenceStatusText()).toBe(test.expected);
//         });
//     });

//     it('should return true when conference is paused', async () => {
//         component.conference.status = ConferenceStatus.Paused;
//         expect(component.isPaused()).toBeTruthy();
//     });

//     it('should return false when conference is not paused', async () => {
//         component.conference.status = ConferenceStatus.InSession;
//         expect(component.isPaused()).toBeFalsy();
//     });

//     it('canShowHearingLayoutSelection returns false when hearing is closed', () => {
//         component.conference.status = ConferenceStatus.Closed;
//         expect(component.canShowHearingLayoutSelection).toBe(false);
//     });

//     it('canShowHearingLayoutSelection returns true when hearing has not started', () => {
//         component.conference.status = ConferenceStatus.NotStarted;
//         expect(component.canShowHearingLayoutSelection).toBe(true);
//     });

//     it('canShowHearingLayoutSelection returns true when hearing is suspended', () => {
//         component.conference.status = ConferenceStatus.Suspended;
//         expect(component.canShowHearingLayoutSelection).toBe(true);
//     });

//     it('canShowHearingLayoutSelection returns true when hearing is paused', () => {
//         component.conference.status = ConferenceStatus.Paused;
//         expect(component.canShowHearingLayoutSelection).toBe(true);
//     });

//     it('canShowHearingLayoutSelection returns false when hearing is in session', () => {
//         component.conference.status = ConferenceStatus.InSession;
//         expect(component.canShowHearingLayoutSelection).toBe(false);
//     });

//     it('should return true when conference is not started', async () => {
//         component.conference.status = ConferenceStatus.NotStarted;
//         expect(component.isNotStarted()).toBeTruthy();
//     });

//     it('should return false when conference is has started', async () => {
//         component.conference.status = ConferenceStatus.InSession;
//         expect(component.isNotStarted()).toBeFalsy();
//     });

//     it('should navigate to check equipment with conference id', async () => {
//         component.checkEquipment();
//         expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, component.conference.id]);
//     });

//     it('should navigate to judge hearing list', async () => {
//         component.goToJudgeHearingList();
//         expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
//     });

//     it('should return "hearingSuspended" true when conference status is suspended', () => {
//         component.conference.status = ConferenceStatus.Suspended;
//         expect(component.hearingSuspended()).toBeTruthy();
//     });

//     it('should return "hearingSuspended" false when conference status is not suspended', () => {
//         component.conference.status = ConferenceStatus.InSession;
//         expect(component.hearingSuspended()).toBeFalsy();
//     });

//     it('should return "hearingPaused" true when conference status is paused', () => {
//         component.conference.status = ConferenceStatus.Paused;
//         expect(component.hearingPaused()).toBeTruthy();
//     });

//     it('should return "hearingPaused" false when conference status is not paused', () => {
//         component.conference.status = ConferenceStatus.InSession;
//         expect(component.hearingPaused()).toBeFalsy();
//     });

//     describe('isHearingInSession', () => {
//         const invalidConferenceStatus = [
//             ConferenceStatus.NotStarted,
//             ConferenceStatus.Paused,
//             ConferenceStatus.Suspended,
//             ConferenceStatus.Closed
//         ];

//         it('hearing in session returns true when the conference is in session', () => {
//             component.conference.status = ConferenceStatus.InSession;
//             expect(component.isHearingInSession()).toBe(true);
//         });

//         invalidConferenceStatus.forEach(status => {
//             it(`hearing in session returns false when the conference is ${status}`, () => {
//                 component.conference.status = status;
//                 expect(component.isHearingInSession()).toBe(false);
//             });
//         });
//     });

//     it('should handle error when get conference fails', async () => {
//         const error = { status: 401, isApiException: true };
//         videoWebService.getConferenceById.and.rejectWith(error);
//         await component.getConference();
//         expect(errorService.handleApiError).toHaveBeenCalledWith(error);
//     });

//     it('should start the hearing', fakeAsync(() => {
//         component.startHearing();
//         flush();

//         expect(videoCallService.startHearing).toHaveBeenCalledWith(component.conference.id, layout);
//     }));

//     it('calls join hearing in session endpoint', async () => {
//         await component.joinHearingInSession();

//         expect(videoCallService.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
//     });

//     describe('Audio recording and alert notifications', () => {
//         beforeEach(() => {
//             notificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
//             notificationToastrService.showAudioRecordingRestartSuccess.calls.reset();
//             notificationToastrService.showAudioRecordingRestartFailure.calls.reset();
//         });

//         describe('getWowzaAgentConnectionState', () => {
//             const wowzaAgentConnectionState$ = new Subject<boolean>();
//             beforeEach(() => {
//                 audioRecordingServiceSpy.getWowzaAgentConnectionState.calls.reset();
//                 notificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
//                 audioRecordingServiceSpy.getWowzaAgentConnectionState.and.returnValue(wowzaAgentConnectionState$.asObservable());
//             });

//             it('Should display audio alert if wowza listener is disconnected', () => {
//                 component.conference.status = ConferenceStatus.InSession;
//                 component.conference.audio_recording_required = true;

//                 component.ngOnInit();
//                 wowzaAgentConnectionState$.next(false);

//                 expect(audioRecordingServiceSpy.getWowzaAgentConnectionState).toHaveBeenCalled();
//                 expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
//             });

//             it('Should not display audio alert if wowza listener is disconnected, but conference is not in session', () => {
//                 component.audioErrorRetryToast = null;
//                 component.conference.audio_recording_required = true;
//                 component.conference.status = ConferenceStatus.Paused;

//                 component.ngOnInit();
//                 wowzaAgentConnectionState$.next(false);

//                 expect(audioRecordingServiceSpy.getWowzaAgentConnectionState).toHaveBeenCalled();
//                 expect(notificationToastrService.showAudioRecordingErrorWithRestart).not.toHaveBeenCalled();
//             });

//             it('Should close alert if hearing is disconnected and no longer showing the video', () => {
//                 component.audioErrorRetryToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//                 component.videoClosedExt();
//                 expect(component.audioErrorRetryToast).toBeNull();
//             });
//         });
//     });

//     describe('shouldCurrentUserJoinHearing', () => {
//         it('should return false if user is a host and status is not InHearing', () => {
//             component.participant.status = ParticipantStatus.Available;
//             const shouldCurrentUserJoinHearing = component.shouldCurrentUserJoinHearing();
//             expect(shouldCurrentUserJoinHearing).toBeFalsy();
//         });

//         it('should return true if user is a host and current status is InHearing', () => {
//             component.participant.status = ParticipantStatus.InHearing;
//             const shouldCurrentUserJoinHearing = component.shouldCurrentUserJoinHearing();
//             expect(shouldCurrentUserJoinHearing).toBeTrue();
//         });
//     });

//     it('should display change device popup', () => {
//         component.displayDeviceChangeModal = false;
//         component.showChooseCameraDialog();
//         expect(component.displayDeviceChangeModal).toBe(true);
//     });

//     it('should hide change device popup on close popup', () => {
//         component.displayDeviceChangeModal = true;
//         component.onSelectMediaDeviceShouldClose();
//         expect(component.displayDeviceChangeModal).toBe(false);
//     });

//     it('should display popup on start clicked', () => {
//         component.displayConfirmStartHearingPopup = false;
//         component.displayConfirmStartPopup();
//         expect(component.displayConfirmStartHearingPopup).toBeTruthy();
//     });

//     it('should NOT start hearing when confirmation answered no', fakeAsync(() => {
//         // Arrange
//         component.displayConfirmStartHearingPopup = true;
//         videoCallService.startHearing.calls.reset();
//         videoCallService.startHearing.and.resolveTo();

//         // Act
//         component.onStartConfirmAnswered(false);
//         flush();

//         // Assert
//         expect(component.displayConfirmStartHearingPopup).toBeFalsy();
//         expect(videoCallService.startHearing).not.toHaveBeenCalled();
//     }));

//     it('should start hearing when confirmation answered yes', fakeAsync(() => {
//         // Arrange
//         component.displayConfirmStartHearingPopup = true;
//         videoCallService.startHearing.calls.reset();
//         videoCallService.startHearing.and.resolveTo();

//         const conferenceId = Guid.create().toString();
//         component.conference.id = conferenceId;
//         spyOnProperty(component, 'conferenceId', 'get').and.returnValue(conferenceId);

//         const hearingLayout = HearingLayout.Dynamic;

//         const hearingId = Guid.create().toString();
//         spyOnProperty(component.hearing, 'id', 'get').and.returnValue(hearingId);

//         // Act
//         component.onStartConfirmAnswered(true);
//         flush();

//         // Assert
//         expect(component.displayConfirmStartHearingPopup).toBeFalsy();
//         expect(videoCallService.startHearing).toHaveBeenCalledOnceWith(hearingId, hearingLayout);
//     }));

//     it('should not enable IM when hearing has not been initalised', () => {
//         component.hearing = null;
//         expect(component.defineIsIMEnabled()).toBeFalsy();
//     });

//     it('should not enable IM when participant is in a consultation', () => {
//         component.participant.status = ParticipantStatus.InConsultation;
//         expect(component.defineIsIMEnabled()).toBeFalsy();
//     });

//     it('should enable IM for non ipad devices', () => {
//         deviceTypeService.isIpad.and.returnValue(false);
//         expect(component.defineIsIMEnabled()).toBeTruthy();
//     });

//     it('should enable IM for ipad devices and video is not on screen', () => {
//         deviceTypeService.isIpad.and.returnValue(true);
//         component.showVideo = false;
//         expect(component.defineIsIMEnabled()).toBeTruthy();
//     });

//     it('should not enable IM for ipad devices and video is on screen', () => {
//         deviceTypeService.isIpad.and.returnValue(true);
//         component.showVideo = true;
//         expect(component.defineIsIMEnabled()).toBeFalsy();
//     });

//     it('should not pull the JUDGE in to the hearing when JUDGE is in Waiting Room and hearing started by the STAFFMEMBER', fakeAsync(() => {
//         component.ngOnInit();
//         component.connected = true;
//         component.conference.status = ConferenceStatus.InSession;
//         component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
//         component.participant = component.conference.participants.find(p => p.role === Role.Judge);

//         component.updateShowVideo();

//         expect(component.conference.participants.find(p => p.role === Role.Judge).status).toBe(ParticipantStatus.Available);
//         expect(component.conferenceStartedBy).toBe(null);
//     }));

//     it('should not pull the STAFFMEMBER in to the hearing when STAFFMEMBER is in Waiting Room and hearing started by the JUDGE', () => {
//         component.ngOnInit();
//         component.connected = true;
//         component.conference.status = ConferenceStatus.InSession;
//         component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.Judge).id;
//         component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);

//         component.updateShowVideo();

//         expect(component.conference.participants.find(p => p.role === Role.StaffMember).status).toBe(ParticipantStatus.Available);
//         expect(component.conferenceStartedBy).toBe(null);
//     });

//     it('should update show video for STAFFMEMBER when STAFFMEMBER started hearing', () => {
//         component.ngOnInit();
//         component.connected = true;
//         component.conference.status = ConferenceStatus.InSession;
//         component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
//         component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);
//         component.participant.status = ParticipantStatus.InHearing;
//         component.updateShowVideo();

//         expect(component.hearing.isInSession()).toBeTrue();
//         expect(component.isOrHasWitnessLink()).toBeFalse();
//         expect(component.isQuickLinkParticipant()).toBeFalse();
//         expect(component.shouldCurrentUserJoinHearing()).toBeTrue();
//         expect(component.displayDeviceChangeModal).toBeFalse();
//         expect(component.showVideo).toBeTrue();
//         expect(component.showConsultationControls).toBeFalse();
//         expect(component.isPrivateConsultation).toBeFalse();
//     });

//     it('should update show video for STAFFMEMBER when STAFFMEMBER join InConsultation room', () => {
//         component.ngOnInit();
//         component.connected = true;
//         component.conference.status = ConferenceStatus.NotStarted;
//         component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
//         component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);
//         component.participant.status = ParticipantStatus.InConsultation;
//         component.updateShowVideo();

//         expect(component.hearing.isInSession()).toBeFalse();
//         expect(component.isOrHasWitnessLink()).toBeFalse();
//         expect(component.isQuickLinkParticipant()).toBeFalse();
//         expect(component.shouldCurrentUserJoinHearing()).toBeFalse();
//         expect(component.displayDeviceChangeModal).toBeFalse();
//         expect(component.showVideo).toBeTrue();
//         expect(component.isPrivateConsultation).toBeTrue();
//         expect(component.showConsultationControls).toBe(!component.isAdminConsultation);
//     });

//     describe('joinHearingClicked', () => {
//         beforeEach(() => {
//             videoCallService.joinHearingInSession.calls.reset();
//         });

//         it('should display join hearing popup when mute microphone feature is enabled', fakeAsync(() => {
//             component.ngOnInit();
//             tick();
//             component.joinHearingClicked();
//             expect(component.displayJoinHearingPopup).toBeTruthy();
//         }));
//     });

//     describe('onJoinConfirmAnswered', () => {
//         beforeEach(() => {
//             videoCallService.joinHearingInSession.calls.reset();
//         });

//         it('should join hearing when answer is true', () => {
//             component.onJoinConfirmAnswered(true);
//             expect(videoCallService.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
//             expect(component.displayJoinHearingPopup).toBeFalsy();
//         });

//         it('should not join hearing when answer is false', () => {
//             component.onJoinConfirmAnswered(false);
//             expect(videoCallService.joinHearingInSession).toHaveBeenCalledTimes(0);
//             expect(component.displayJoinHearingPopup).toBeFalsy();
//         });
//     });
// });
