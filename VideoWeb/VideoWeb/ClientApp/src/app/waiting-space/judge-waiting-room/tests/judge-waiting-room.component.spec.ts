import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
    ConferenceResponse,
    ConferenceStatus,
    HearingLayout,
    LoggedParticipantResponse,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import {
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    focusService,
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    hideComponentsService,
    initAllWRDependencies,
    logger,
    mockedHearingVenueFlagsService,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    titleService,
    videoCallService,
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { JudgeWaitingRoomComponent } from '../judge-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ConsultationInvitation } from '../../services/consultation-invitation.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { Guid } from 'guid-typescript';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { VideoControlService } from 'src/app/services/conference/video-control.service';
import { ConferenceService } from 'src/app/services/conference/conference.service';
import { VideoControlCacheService } from 'src/app/services/conference/video-control-cache.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { Observable, of, Subject } from 'rxjs';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { VirtualMeetingRoomModel } from 'src/app/services/conference/models/virtual-meeting-room.model';
import { HearingRole } from '../../models/hearing-role-model';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { HearingLayoutService } from 'src/app/services/hearing-layout.service';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import { ParticipantDeleted, ParticipantUpdated } from '../../models/video-call-models';
import { PexipDisplayNameModel } from '../../../services/conference/models/pexip-display-name.model';
import { WaitingRoomBaseDirective } from '../../waiting-room-shared/waiting-room-base.component';
import { videoCallServiceSpy } from '../../../testing/mocks/mock-video-call.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    const participantOneId = Guid.create().toString();
    const participantOne = new ParticipantForUserResponse({
        id: participantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Judge',
        role: Role.Judge,
        representee: null,
        case_type_group: 'judge',
        tiled_display_name: `CIVILIAN;Judge;${participantOneId}`,
        hearing_role: HearingRole.JUDGE,
        first_name: 'Judge',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    const participantTwoId = Guid.create().toString();
    const participantTwo = new ParticipantForUserResponse({
        id: participantTwoId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpretee',
        role: Role.Individual,
        representee: null,
        case_type_group: 'applicant',
        tiled_display_name: `CIVILIAN;Interpretee;${participantTwoId}`,
        hearing_role: HearingRole.LITIGANT_IN_PERSON,
        first_name: 'Interpretee',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    const vmrId = '1234';
    const vmrLabel = 'vmr-label';
    const vmrLocked = false;
    const vmrParticipantOneId = Guid.create().toString();
    const vmrParticipantOne = new ParticipantForUserResponse({
        id: vmrParticipantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'PanelMember 1',
        role: Role.JudicialOfficeHolder,
        representee: null,
        case_type_group: 'PanelMember',
        tiled_display_name: `JOH;PannelMember;${vmrParticipantOneId}`,
        hearing_role: HearingRole.PANEL_MEMBER,
        first_name: 'PanelMember',
        last_name: 'One',
        interpreter_room: new RoomSummaryResponse({
            id: vmrId,
            label: vmrLabel,
            locked: vmrLocked
        }),
        linked_participants: []
    });

    const vmrParticipantTwoId = Guid.create().toString();
    const vmrParticipantTwo = new ParticipantForUserResponse({
        id: vmrParticipantTwoId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'PanelMember 2',
        role: Role.JudicialOfficeHolder,
        representee: null,
        case_type_group: 'PanelMember',
        tiled_display_name: `JOH;PannelMember;${vmrParticipantTwoId}`,
        hearing_role: HearingRole.PANEL_MEMBER,
        first_name: 'PanelMember',
        last_name: 'Two',
        interpreter_room: new RoomSummaryResponse({
            id: vmrId,
            label: vmrLabel,
            locked: vmrLocked
        }),
        linked_participants: []
    });

    const wowzaParticipant: PexipParticipant = {
        buzz_time: 0,
        call_tag: null,
        display_name: 'vh-wowza-dev',
        external_node_uuid: '',
        has_media: true,
        is_audio_only_call: 'YES',
        is_external: false,
        is_muted: 'NO',
        is_video_call: 'false',
        local_alias: '',
        mute_supported: 'false',
        protocol: '',
        spotlight: 0,
        start_time: 0,
        uuid: 'wowza_id'
    };

    let component: JudgeWaitingRoomComponent;
    let activatedRoute: ActivatedRoute;
    let logged: LoggedParticipantResponse;
    const translateService = translateServiceSpy;
    let consultationInvitiation: ConsultationInvitation;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoControlServiceSpy: jasmine.SpyObj<VideoControlService>;
    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let shouldUnloadSubject: Subject<void>;
    let shouldReloadSubject: Subject<void>;
    let hearingLayoutServiceSpy: jasmine.SpyObj<HearingLayoutService>;
    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>(
            'UnloadDetectorService',
            [],
            ['shouldUnload', 'shouldReload']
        );
        shouldUnloadSubject = new Subject<void>();
        shouldReloadSubject = new Subject<void>();
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldReload').and.returnValue(shouldReloadSubject.asObservable());

        consultationInvitiation = {} as ConsultationInvitation;
        logged = new LoggedParticipantResponse({
            participant_id: globalParticipant.id,
            display_name: globalParticipant.display_name,
            role: globalParticipant.role
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
        };

        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>(
            'ConferenceService',
            ['getConferenceById'],
            ['onCurrentConferenceStatusChanged$', 'currentConferenceId', 'currentConference']
        );
        getSpiedPropertyGetter(conferenceServiceSpy, 'onCurrentConferenceStatusChanged$').and.returnValue(
            jasmine.createSpyObj<Observable<{ oldStatus: ConferenceStatus; newStatus: ConferenceStatus }>>('Observable', ['subscribe'])
        );

        participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
            'ParticipantService',
            ['getPexipIdForParticipant'],
            [
                'onParticipantConnectedToPexip$',
                'onParticipantPexipIdChanged$',
                'onVmrConnectedToPexip$',
                'onVmrPexipIdChanged$',
                'onParticipantStatusChanged$',
                'participants',
                'virtualMeetingRooms'
            ]
        );
        getSpiedPropertyGetter(participantServiceSpy, 'onParticipantConnectedToPexip$').and.returnValue(
            jasmine.createSpyObj<Observable<ParticipantModel>>('Observable', ['subscribe'])
        );
        getSpiedPropertyGetter(participantServiceSpy, 'onParticipantPexipIdChanged$').and.returnValue(
            jasmine.createSpyObj<Observable<ParticipantModel>>('Observable', ['subscribe'])
        );
        getSpiedPropertyGetter(participantServiceSpy, 'onParticipantStatusChanged$').and.returnValue(
            jasmine.createSpyObj<Observable<ParticipantModel>>('Observable', ['subscribe'])
        );
        getSpiedPropertyGetter(participantServiceSpy, 'onVmrConnectedToPexip$').and.returnValue(
            jasmine.createSpyObj<Observable<VirtualMeetingRoomModel>>('Observable', ['subscribe'])
        );
        getSpiedPropertyGetter(participantServiceSpy, 'onVmrPexipIdChanged$').and.returnValue(
            jasmine.createSpyObj<Observable<VirtualMeetingRoomModel>>('Observable', ['subscribe'])
        );

        videoControlServiceSpy = jasmine.createSpyObj<VideoControlService>('VideoControlService', [
            'setSpotlightStatus',
            'restoreParticipantsSpotlight'
        ]);
        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', [
            'setSpotlightStatus',
            'getLocalAudioMuted',
            'setRemoteMutedStatus',
            'getLocalVideoMuted'
        ]);

        hearingLayoutServiceSpy = jasmine.createSpyObj<HearingLayoutService>([], ['currentLayout$']);

        participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.wowzaPolling, true).and.returnValue(of(true));

        component = new JudgeWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            translateService,
            consultationInvitiationService,
            conferenceServiceSpy,
            participantServiceSpy,
            videoControlServiceSpy,
            videoControlCacheServiceSpy,
            unloadDetectorServiceSpy,
            hearingLayoutServiceSpy,
            participantRemoteMuteStoreServiceSpy,
            mockedHearingVenueFlagsService,
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyServiceSpy
        );

        consultationInvitiationService.getInvitation.and.returnValue(consultationInvitiation);

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }

        if (component.audioRecordingInterval) {
            clearInterval(component.callbackTimeout);
        }
    });

    const pexipParticipant: PexipParticipant = {
        buzz_time: 0,
        call_tag: Guid.create().toString(),
        display_name: `T1;John Doe;${participantOne.id}`,
        has_media: true,
        is_audio_only_call: 'No',
        is_muted: 'Yes',
        is_external: false,
        is_video_call: 'Yes',
        mute_supported: 'Yes',
        local_alias: null,
        start_time: new Date().getTime(),
        uuid: Guid.create().toString(),
        spotlight: 0,
        external_node_uuid: null,
        protocol: 'webrtc'
    };

    it('should call assignPexipId when uuid and pexip id contains in the participantDisplayName', () => {
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        component.assignPexipIdToRemoteStore(participantUpdated);

        expect(participantRemoteMuteStoreServiceSpy.assignPexipId).toHaveBeenCalled();
    });

    it('should NOT call assignPexipId when participantDisplayName does not contain uuid', () => {
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        participantUpdated.uuid = undefined;

        component.assignPexipIdToRemoteStore(participantUpdated);

        expect(participantRemoteMuteStoreServiceSpy.assignPexipId).not.toHaveBeenCalled();
    });

    it('should NOT call assignPexipId when participantDisplayName does not contain display name ', () => {
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        spyOn(PexipDisplayNameModel, 'fromString').and.returnValue(null);

        component.assignPexipIdToRemoteStore(participantUpdated);

        expect(participantRemoteMuteStoreServiceSpy.assignPexipId).not.toHaveBeenCalled();
    });

    it('should update wowza participant if update is for Wowza Listener', () => {
        const wowzaParticipantUpdate = { uuid: 'wowzaId', isAudioOnlyCall: true } as ParticipantUpdated;
        component.wowzaAgent = { uuid: wowzaParticipantUpdate.uuid } as ParticipantUpdated;
        component.updateWowzaParticipant(wowzaParticipantUpdate);
        expect(component.wowzaAgent).toBe(wowzaParticipantUpdate);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should init hearing alert and setup Client', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        tick(100);
        expect(component.eventHubSubscription$).toBeDefined();
    }));

    it('should init hearing alert and subscribers', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        tick(100);
        expect(component.eventHubSubscription$).toBeDefined();
        expect(component.videoCallSubscription$).toBeDefined();
        expect(videoCallService.setupClient).toHaveBeenCalled();
    }));

    const getConferenceStatusTextTestCases = [
        { status: ConferenceStatus.NotStarted, expected: 'judge-waiting-room.start-this-hearing' },
        { status: ConferenceStatus.InSession, expected: 'judge-waiting-room.hearing-is-in-session' },
        { status: ConferenceStatus.Paused, expected: 'judge-waiting-room.hearing-paused' },
        { status: ConferenceStatus.Suspended, expected: 'judge-waiting-room.hearing-suspended' },
        { status: ConferenceStatus.Closed, expected: 'judge-waiting-room.hearing-is-closed' }
    ];

    getConferenceStatusTextTestCases.forEach(test => {
        it(`should return hearing status text '${test.expected}'`, () => {
            component.conference.status = test.status;
            translateService.instant.calls.reset();
            expect(component.getConferenceStatusText()).toBe(test.expected);
        });
    });

    it('should return true when conference is paused', async () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.isPaused()).toBeTruthy();
    });

    it('should return false when conference is not paused', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isPaused()).toBeFalsy();
    });

    it('canShowHearingLayoutSelection returns false when hearing is closed', () => {
        component.conference.status = ConferenceStatus.Closed;
        expect(component.canShowHearingLayoutSelection).toBe(false);
    });

    it('canShowHearingLayoutSelection returns true when hearing has not started', () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.canShowHearingLayoutSelection).toBe(true);
    });

    it('canShowHearingLayoutSelection returns true when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.canShowHearingLayoutSelection).toBe(true);
    });

    it('canShowHearingLayoutSelection returns true when hearing is paused', () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.canShowHearingLayoutSelection).toBe(true);
    });

    it('canShowHearingLayoutSelection returns false when hearing is in session', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.canShowHearingLayoutSelection).toBe(false);
    });

    it('should return true when conference is not started', async () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.isNotStarted()).toBeTruthy();
    });

    it('should return false when conference is has started', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isNotStarted()).toBeFalsy();
    });

    it('should navigate to check equipment with conference id', async () => {
        component.checkEquipment();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, component.conference.id]);
    });

    it('should navigate to judge hearing list', async () => {
        component.goToJudgeHearingList();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should return "hearingSuspended" true when conference status is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.hearingSuspended()).toBeTruthy();
    });

    it('should return "hearingSuspended" false when conference status is not suspended', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingSuspended()).toBeFalsy();
    });

    it('should return "hearingPaused" true when conference status is paused', () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.hearingPaused()).toBeTruthy();
    });

    it('should return "hearingPaused" false when conference status is not paused', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingPaused()).toBeFalsy();
    });

    describe('isHearingInSession', () => {
        const invalidConferenceStatus = [
            ConferenceStatus.NotStarted,
            ConferenceStatus.Paused,
            ConferenceStatus.Suspended,
            ConferenceStatus.Closed
        ];

        it('hearing in session returns true when the conference is in session', () => {
            component.conference.status = ConferenceStatus.InSession;
            expect(component.isHearingInSession()).toBe(true);
        });

        invalidConferenceStatus.forEach(status => {
            it(`hearing in session returns false when the conference is ${status}`, () => {
                component.conference.status = status;
                expect(component.isHearingInSession()).toBe(false);
            });
        });
    });

    it('should handle error when get conference fails', async () => {
        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);
        await component.getConference();
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should start the hearing', fakeAsync(() => {
        const layout = HearingLayout.TwoPlus21;
        getSpiedPropertyGetter(hearingLayoutServiceSpy, 'currentLayout$').and.returnValue(of(layout));
        component.startHearing();
        flush();

        expect(videoCallService.startHearing).toHaveBeenCalledWith(component.conference.id, layout);
        expect(component.hostWantsToJoinHearing).toBeTrue();
    }));

    it('should handle api error when start hearing fails', async () => {
        const error = { status: 500, isApiException: true };
        videoCallService.startHearing.and.returnValue(Promise.reject(error));
        const layout = HearingLayout.TwoPlus21;
        getSpiedPropertyGetter(hearingLayoutServiceSpy, 'currentLayout$').and.returnValue(of(layout));
        await component.startHearing();
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('calls join hearing in session endpoint', async () => {
        await component.joinHearingInSession();

        expect(videoCallService.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
        expect(component.shouldCurrentUserJoinHearing()).toBeTrue();
    });

    describe('Monitoring the wowza-listener participant', () => {
        beforeEach(() => {
            videoCallService.onParticipantCreated.and.returnValue(of(ParticipantUpdated.fromPexipParticipant(wowzaParticipant)));
            notificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
        });
        it('Should set wowza listener property when participant exists in onParticipantCreated callback', () => {
            component.ngOnInit();
            expect(component.wowzaAgent).toBeTruthy();
        });

        it('Should display audio alert if wowza listener is deleted', () => {
            videoCallService.onParticipantDeleted.and.returnValue(of(new ParticipantDeleted(wowzaParticipant.uuid)));
            component.conference.status = ConferenceStatus.InSession;
            component.conference.audio_recording_required = true;

            component.ngOnInit();
            expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
        });

        it('Should not display audio alert if wowza listener is deleted, but conference is not in session', () => {
            component.audioErrorRetryToast = null;
            component.conference.audio_recording_required = true;
            component.conference.status = ConferenceStatus.Paused;
            videoCallService.onParticipantDeleted.and.returnValue(of(new ParticipantDeleted(wowzaParticipant.uuid)));

            component.ngOnInit();
            expect(component.audioErrorRetryToast).toBeFalsy();
            expect(notificationToastrService.showAudioRecordingErrorWithRestart).not.toHaveBeenCalled();
        });
    });

    describe('shouldCurrentUserJoinHearing', () => {
        it('should return false if user is a host and status is not InHearing', () => {
            component.participant.status = ParticipantStatus.Available;

            const shouldCurrentUserJoinHearing = component.shouldCurrentUserJoinHearing();

            expect(shouldCurrentUserJoinHearing).toBeFalsy();
        });

        it('should return true if user is a host and current status is InHearing', () => {
            component.participant.status = ParticipantStatus.InHearing;
            const shouldCurrentUserJoinHearing = component.shouldCurrentUserJoinHearing();

            expect(shouldCurrentUserJoinHearing).toBeTrue();
        });
    });

    describe('conferenceRecordingInSessionForSeconds property', () => {
        const currentConferenceRecordingInSessionForSeconds = 10;
        const currentAudioRecordingStreamCheckIntervalSeconds = 30;

        beforeEach(() => {
            component.continueWithNoRecording = false;
            component.recordingSessionSeconds = currentConferenceRecordingInSessionForSeconds;
            component.audioStreamIntervalSeconds = currentAudioRecordingStreamCheckIntervalSeconds;
        });

        it('should accumulate when conference is in session', async () => {
            component.conference.status = ConferenceStatus.InSession;
            component.verifyAudioRecordingStream();
            expect(component.recordingSessionSeconds).toBe(
                currentConferenceRecordingInSessionForSeconds + currentAudioRecordingStreamCheckIntervalSeconds
            );
        });

        it('should reset when conference is not in session', async () => {
            component.conference.status = ConferenceStatus.Paused;
            component.verifyAudioRecordingStream();
            expect(component.recordingSessionSeconds).toBe(0);
        });

        it('should switch the continueWithNoRecording flag to false when conference is not in session', async () => {
            component.conference.status = ConferenceStatus.Paused;
            component.continueWithNoRecording = true;
            component.verifyAudioRecordingStream();
            expect(component.continueWithNoRecording).toBe(false);
        });

        it('should not switch the continueWithNoRecording flag when conference is in session', async () => {
            component.conference.status = ConferenceStatus.InSession;
            component.continueWithNoRecording = true;
            component.verifyAudioRecordingStream();
            expect(component.continueWithNoRecording).toBe(true);
        });
    });

    it('should init audio recording interval', () => {
        spyOn(component, 'verifyAudioRecordingStream');
        component.initAudioRecordingInterval();
        expect(component.audioRecordingInterval).toBeDefined();
    });

    it('should display change device popup', () => {
        component.displayDeviceChangeModal = false;
        component.showChooseCameraDialog();
        expect(component.displayDeviceChangeModal).toBe(true);
    });

    it('should hide change device popup on close popup', () => {
        component.displayDeviceChangeModal = true;
        component.onSelectMediaDeviceShouldClose();
        expect(component.displayDeviceChangeModal).toBe(false);
    });

    it('should display popup on start clicked', () => {
        component.displayConfirmStartHearingPopup = false;
        component.displayConfirmStartPopup();
        expect(component.displayConfirmStartHearingPopup).toBeTruthy();
    });

    it('should NOT start hearing when confirmation answered no', fakeAsync(() => {
        // Arrange
        component.displayConfirmStartHearingPopup = true;
        videoCallService.startHearing.calls.reset();
        videoCallService.startHearing.and.resolveTo();

        // Act
        component.onStartConfirmAnswered(false);
        flush();

        // Assert
        expect(component.displayConfirmStartHearingPopup).toBeFalsy();
        expect(videoCallService.startHearing).not.toHaveBeenCalled();
    }));

    it('should start hearing when confirmation answered yes', fakeAsync(() => {
        // Arrange
        component.displayConfirmStartHearingPopup = true;
        videoCallService.startHearing.calls.reset();
        videoCallService.startHearing.and.resolveTo();

        const conferenceId = Guid.create().toString();
        component.conference.id = conferenceId;
        spyOnProperty(component, 'conferenceId', 'get').and.returnValue(conferenceId);

        const hearingLayout = HearingLayout.Dynamic;
        getSpiedPropertyGetter(hearingLayoutServiceSpy, 'currentLayout$').and.returnValue(of(hearingLayout));

        const hearingId = Guid.create().toString();
        spyOnProperty(component.hearing, 'id', 'get').and.returnValue(hearingId);

        // Act
        component.onStartConfirmAnswered(true);
        flush();

        // Assert
        expect(component.displayConfirmStartHearingPopup).toBeFalsy();
        expect(videoCallService.startHearing).toHaveBeenCalledOnceWith(hearingId, hearingLayout);
        expect(component.hostWantsToJoinHearing).toBeTrue();
    }));

    it('should not enable IM when hearing has not been initalised', () => {
        component.hearing = null;
        expect(component.defineIsIMEnabled()).toBeFalsy();
    });

    it('should not enable IM when participant is in a consultation', () => {
        component.participant.status = ParticipantStatus.InConsultation;
        expect(component.defineIsIMEnabled()).toBeFalsy();
    });

    it('should enable IM for non ipad devices', () => {
        deviceTypeService.isIpad.and.returnValue(false);
        expect(component.defineIsIMEnabled()).toBeTruthy();
    });

    it('should enable IM for ipad devices and video is not on screen', () => {
        deviceTypeService.isIpad.and.returnValue(true);
        component.showVideo = false;
        expect(component.defineIsIMEnabled()).toBeTruthy();
    });

    it('should not enable IM for ipad devices and video is on screen', () => {
        deviceTypeService.isIpad.and.returnValue(true);
        component.showVideo = true;
        expect(component.defineIsIMEnabled()).toBeFalsy();
    });

    it('should not pull the JUDGE in to the hearing when JUDGE is in Waiting Room and hearing started by the STAFFMEMBER', fakeAsync(() => {
        component.ngOnInit();
        component.connected = true;
        component.conference.status = ConferenceStatus.InSession;
        component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
        component.participant = component.conference.participants.find(p => p.role === Role.Judge);

        component.updateShowVideo();

        expect(component.conference.participants.find(p => p.role === Role.Judge).status).toBe(ParticipantStatus.Available);
        expect(component.conferenceStartedBy).toBe(null);
    }));

    it('should set shouldUpdateHostShowVideo to false when participant not connecting to pexip', async () => {
        component.hostWantsToJoinHearing = true;
        component.connected = false;

        component.updateShowVideo();

        expect(component.hostWantsToJoinHearing).toBeFalse();
    });

    it('should not pull the STAFFMEMBER in to the hearing when STAFFMEMBER is in Waiting Room and hearing started by the JUDGE', () => {
        component.ngOnInit();
        component.connected = true;
        component.conference.status = ConferenceStatus.InSession;
        component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.Judge).id;
        component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);

        component.updateShowVideo();

        expect(component.conference.participants.find(p => p.role === Role.StaffMember).status).toBe(ParticipantStatus.Available);
        expect(component.conferenceStartedBy).toBe(null);
    });

    it('should update show video for STAFFMEMBER when STAFFMEMBER started hearing', () => {
        component.ngOnInit();
        component.connected = true;
        component.conference.status = ConferenceStatus.InSession;
        component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
        component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);
        component.participant.status = ParticipantStatus.InHearing;
        component.hostWantsToJoinHearing = true;
        component.updateShowVideo();

        expect(component.hearing.isInSession()).toBeTrue();
        expect(component.isOrHasWitnessLink()).toBeFalse();
        expect(component.isQuickLinkParticipant()).toBeFalse();
        expect(component.shouldCurrentUserJoinHearing()).toBeTrue();
        expect(component.displayDeviceChangeModal).toBeFalse();
        expect(component.showVideo).toBeTrue();
        expect(component.showConsultationControls).toBeFalse();
        expect(component.isPrivateConsultation).toBeFalse();
    });

    it('should update show video for STAFFMEMBER when STAFFMEMBER join InConsultation room', () => {
        component.ngOnInit();
        component.connected = true;
        component.conference.status = ConferenceStatus.NotStarted;
        component.conferenceStartedBy = component.conference.participants.find(p => p.role === Role.StaffMember).id;
        component.participant = component.conference.participants.find(p => p.role === Role.StaffMember);
        component.participant.status = ParticipantStatus.InConsultation;
        component.hostWantsToJoinHearing = false;
        component.updateShowVideo();

        expect(component.hearing.isInSession()).toBeFalse();
        expect(component.isOrHasWitnessLink()).toBeFalse();
        expect(component.isQuickLinkParticipant()).toBeFalse();
        expect(component.shouldCurrentUserJoinHearing()).toBeFalse();
        expect(component.displayDeviceChangeModal).toBeFalse();
        expect(component.showVideo).toBeTrue();
        expect(component.isPrivateConsultation).toBeTrue();
        expect(component.showConsultationControls).toBe(!component.isAdminConsultation);
    });

    describe('onConferenceStatusChanged', () => {
        it('should spotlight judge on conference start and restore all other participant states if it is first time the conference has started', () => {
            // Arrange
            const judgeParticipant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            const nonJudgeParticipants = [participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const nonVmrParticipants = [judgeParticipant, ...nonJudgeParticipants];
            const vmrs = [VirtualMeetingRoomModel.fromRoomSummaryResponse(vmrParticipantOne.interpreter_room)];
            const participants = [ParticipantModel.fromParticipantForUserResponse(vmrParticipantOne), ...nonVmrParticipants];

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);
            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue(vmrs);

            // Act
            component.onConferenceStatusChanged({
                oldStatus: ConferenceStatus.NotStarted,
                newStatus: ConferenceStatus.InSession
            });

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(judgeParticipant.id, true);
            expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledTimes(nonVmrParticipants.length + vmrs.length);
            nonJudgeParticipants.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
            vmrs.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
        });

        it('should restore all other participant states if it is NOT first time the conference has started', () => {
            // Arrange
            const nonVmrParticipants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const vmrs = [VirtualMeetingRoomModel.fromRoomSummaryResponse(vmrParticipantOne.interpreter_room)];
            const participants = [ParticipantModel.fromParticipantForUserResponse(vmrParticipantOne), ...nonVmrParticipants];

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);
            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue(vmrs);

            // Act
            component.onConferenceStatusChanged({
                oldStatus: ConferenceStatus.Paused,
                newStatus: ConferenceStatus.InSession
            });

            // Assert
            expect(videoControlServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
            expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledTimes(nonVmrParticipants.length + vmrs.length);
            nonVmrParticipants.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
            vmrs.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
        });

        it('should do nothing if the new status is not in session', () => {
            // Arrange
            const participants = [];

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);

            // Act
            component.onConferenceStatusChanged({
                oldStatus: ConferenceStatus.Paused,
                newStatus: ConferenceStatus.Closed
            });

            // Assert
            expect(videoControlServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
            expect(videoControlServiceSpy.restoreParticipantsSpotlight).not.toHaveBeenCalled();
        });
    });

    describe('restoreSpotlightState', () => {
        it('should restore all other participant/vmrs states if it is NOT first time the conference has started', () => {
            // Arrange
            const nonVmrParticipants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const vmrs = [VirtualMeetingRoomModel.fromRoomSummaryResponse(vmrParticipantOne.interpreter_room)];
            const participants = [ParticipantModel.fromParticipantForUserResponse(vmrParticipantOne), ...nonVmrParticipants];

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);
            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue(vmrs);

            // Act
            component.restoreSpotlightState();

            // Assert
            expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledTimes(nonVmrParticipants.length + vmrs.length);
            nonVmrParticipants.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
            vmrs.forEach(x => expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledWith(x));
        });
    });

    describe('onConferenceInSessionCheckForDisconnectedParticipants', () => {
        it('should do nothing if the conference is not in session', () => {
            // Arrange
            const participants = [];

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);

            // Act
            component.onConferenceInSessionCheckForDisconnectedParticipants({
                oldStatus: ConferenceStatus.Paused,
                newStatus: ConferenceStatus.Closed
            });

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
        });

        it('should set spotlight status in cache to false for all disconnected participants', () => {
            // Arrange
            const participants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            participants[0].status = ParticipantStatus.Disconnected;

            const conferenceId = 'conference-id';

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);
            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue([]);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            component.onConferenceInSessionCheckForDisconnectedParticipants({
                oldStatus: ConferenceStatus.Paused,
                newStatus: ConferenceStatus.InSession
            });

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(participantOneId, false);
        });

        it('should set spotlight status in cache to false for a VMR if all participants are disconnected', () => {
            // Arrange
            const participants = [vmrParticipantOne, vmrParticipantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            participants[0].status = ParticipantStatus.Disconnected;
            participants[1].status = ParticipantStatus.Disconnected;
            const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[0].virtualMeetingRoomSummary);
            vmr.participants = participants;

            const conferenceId = 'conference-id';

            getSpiedPropertyGetter(participantServiceSpy, 'participants').and.returnValue(participants);
            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue([vmr]);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            component.onConferenceInSessionCheckForDisconnectedParticipants({
                oldStatus: ConferenceStatus.Paused,
                newStatus: ConferenceStatus.InSession
            });

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(vmr.id, false);
        });

        describe('Audio Alert tests', () => {
            const toast = jasmine.createSpyObj<VhToastComponent>(
                'VhToastComponent',
                { actioned: true },
                {
                    vhToastOptions: {
                        concludeToast: () => {
                            component.audioRestartCallback(false);
                        },
                        buttons: [],
                        color: 'white'
                    }
                }
            );

            beforeEach(() => {
                component.showVideo = true;
                component.wowzaAgent = ParticipantUpdated.fromPexipParticipant(wowzaParticipant);
                notificationToastrService.showAudioRecordingErrorWithRestart.and.returnValue(toast);
                notificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
                notificationToastrService.showAudioRecordingRestartSuccess.calls.reset();
                notificationToastrService.showAudioRecordingRestartFailure.calls.reset();
                eventsService.sendAudioRestartActioned.calls.reset();
            });

            it('should continue with no recording when judge dismisses the audio recording alert mid hearing', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 61;
                component.conference.status = ConferenceStatus.InSession;
                component.verifyAudioRecordingStream();

                component.audioRestartCallback(true);

                expect(component.audioErrorRetryToast).toBeFalsy();
                expect(component.continueWithNoRecording).toBeTruthy();
            });

            it('should only display one toast for audio recording issues', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 61;
                component.conference.status = ConferenceStatus.InSession;

                component.verifyAudioRecordingStream();

                expect(component.audioErrorRetryToast).toBeTruthy();
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalledTimes(1);
            });

            it('should display audio recording alert when wowza agent not set to isAudioOnlyCall', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 61;
                component.conference.status = ConferenceStatus.InSession;
                component.verifyAudioRecordingStream();
                expect(component.audioErrorRetryToast).toBeTruthy();
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
            });

            it('should not display audio recording alert before 20 seconds has passed', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 0;
                component.conference.status = ConferenceStatus.InSession;
                component.verifyAudioRecordingStream();
                expect(component.audioErrorRetryToast).toBeFalsy();
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).not.toHaveBeenCalled();
            });

            it('should not preform audio recording check if continuing with no recording', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 100;
                component.conference.status = ConferenceStatus.InSession;
                component.continueWithNoRecording = true;
                component.verifyAudioRecordingStream();
                expect(component.audioErrorRetryToast).toBeFalsy();
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).not.toHaveBeenCalled();
            });

            it('should not preform audio recording check if hearing isnt InSession', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 100;
                component.conference.status = ConferenceStatus.Paused;
                component.verifyAudioRecordingStream();
                expect(component.audioErrorRetryToast).toBeFalsy();
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalledTimes(0);
            });

            it('should reset notification state if hearing status not InSession', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.recordingSessionSeconds = 100;
                component.conference.status = ConferenceStatus.Paused;
                component.continueWithNoRecording = true;
                component.verifyAudioRecordingStream();
                expect(component.continueWithNoRecording).toBeFalsy();
                expect(component.audioErrorRetryToast).toBeFalsy();
            });

            it('should not display audio recording alert when when all checks are valid', async () => {
                component.recordingSessionSeconds = 61;
                component.conference.status = ConferenceStatus.InSession;
                component.verifyAudioRecordingStream();
                expect(component.audioErrorRetryToast).toBeFalsy();
            });

            it('when wowza listerner missing, but toast for restart already open, do nothing', async () => {
                videoCallService.onParticipantDeleted.and.returnValue(of(new ParticipantDeleted(wowzaParticipant.uuid)));
                component.conference.status = ConferenceStatus.InSession;
                component.conference.audio_recording_required = true;
                component.audioErrorRetryToast = jasmine.createSpyObj(VhToastComponent, ['actioned']);
                component.audioErrorRetryToast.actioned = false;
                component.ngOnInit();
                expect(notificationToastrService.showAudioRecordingRestartFailure).toHaveBeenCalledTimes(0);
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalledTimes(0);
            });

            it('when audio stream triggered again before action, but toast for restart already open, do nothing', async () => {
                component.wowzaAgent.isAudioOnlyCall = false;
                component.continueWithNoRecording = false;
                component.audioErrorRetryToast = jasmine.createSpyObj(VhToastComponent, ['actioned']);
                component.recordingSessionSeconds = 61;
                component.conference.status = ConferenceStatus.InSession;
                component.verifyAudioRecordingStream();
                expect(notificationToastrService.showAudioRecordingRestartFailure).toHaveBeenCalledTimes(0);
                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalledTimes(0);
            });

            describe('should display audio recording restart alert, then success toastr', () => {
                beforeEach(() => {
                    videoCallServiceSpy.connectWowzaAgent.and.callFake((ingestUrl, callback) =>
                        callback({ status: 'success', result: ['newWowzaUUID'] })
                    );
                });

                it('when audio fails, will attempt to restart', () => {
                    component.wowzaAgent.isAudioOnlyCall = false;
                    component.continueWithNoRecording = false;
                    component.recordingSessionSeconds = 61;
                    component.conference.status = ConferenceStatus.InSession;
                    component.verifyAudioRecordingStream();
                    component.reconnectToWowza();
                    expect(component.audioErrorRetryToast).toBeTruthy();
                    expect(eventsService.sendAudioRestartActioned).toHaveBeenCalled();
                });

                it('when wowza listener missing', async () => {
                    component.wowzaAgent = null;
                    component.continueWithNoRecording = false;
                    component.recordingSessionSeconds = 61;
                    component.conference.status = ConferenceStatus.InSession;
                    component.verifyAudioRecordingStream();
                    await component.reconnectToWowza();
                    expect(component.audioErrorRetryToast).toBeTruthy();
                    expect(eventsService.sendAudioRestartActioned).toHaveBeenCalled();
                });
            });

            describe('should display audio recording restart alert, then failed toastr', () => {
                beforeEach(() => {
                    videoCallServiceSpy.connectWowzaAgent.and.callFake((ingestUrl, callback) => callback({ status: 'failed' }));
                });

                it('when audio info returns false and hearing must be recorded', () => {
                    component.wowzaAgent.isAudioOnlyCall = false;
                    component.continueWithNoRecording = false;
                    component.recordingSessionSeconds = 61;
                    component.conference.status = ConferenceStatus.InSession;
                    component.verifyAudioRecordingStream();
                    component.reconnectToWowza();
                    expect(component.audioErrorRetryToast).toBeTruthy();
                    expect(eventsService.sendAudioRestartActioned).toHaveBeenCalledTimes(0);
                    expect(notificationToastrService.showAudioRecordingRestartFailure).toHaveBeenCalled();
                });

                it('when audio info returns true but wowza listener missing', () => {
                    component.wowzaAgent = null;
                    component.continueWithNoRecording = false;
                    component.recordingSessionSeconds = 61;
                    component.conference.status = ConferenceStatus.InSession;
                    component.verifyAudioRecordingStream();
                    component.reconnectToWowza();
                    expect(component.audioErrorRetryToast).toBeTruthy();
                    expect(eventsService.sendAudioRestartActioned).toHaveBeenCalledTimes(0);
                    expect(notificationToastrService.showAudioRecordingRestartFailure).toHaveBeenCalled();
                });
            });

            describe('Multiple Hosts Audio Alert', () => {
                it('When Audio Recording Alert is displayed, restart is actioned by another user and closed for the current user', () => {
                    // Arrange
                    component.wowzaAgent.isAudioOnlyCall = false;
                    component.continueWithNoRecording = false;
                    component.audioErrorRetryToast = null;
                    component.recordingSessionSeconds = 61;
                    component.conference.status = ConferenceStatus.InSession;
                    // Act
                    component.verifyAudioRecordingStream();
                    // Assert
                    expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
                    expect(component.audioErrorRetryToast).toBeTruthy();
                    // Act
                    eventsService.getAudioRestartActioned.and.returnValue(of(globalConference.id));
                    component.ngOnInit();
                    // Assert
                    expect(component.audioErrorRetryToast).toBeFalsy();
                });
            });
        });
    });

    describe('shouldUnmuteForHearing', () => {
        let superShouldUnmuteForHearing: jasmine.SpyObj<any>;

        beforeEach(() => {
            superShouldUnmuteForHearing = spyOn(WaitingRoomBaseDirective.prototype, 'shouldUnmuteForHearing');
        });

        it('should return false when super.shouldUnmuteForHearing is false hostWantsToJoinHearing is false', () => {
            superShouldUnmuteForHearing.and.returnValue(false);
            component.hostWantsToJoinHearing = false;
            expect(component.shouldUnmuteForHearing()).toBe(false);
        });

        it('should return false when super.shouldUnmuteForHearing is false hostWantsToJoinHearing is true', () => {
            superShouldUnmuteForHearing.and.returnValue(false);
            component.hostWantsToJoinHearing = true;
            expect(component.shouldUnmuteForHearing()).toBe(false);
        });

        it('should return false when super.shouldUnmuteForHearing is true hostWantsToJoinHearing is false', () => {
            superShouldUnmuteForHearing.and.returnValue(true);
            component.hostWantsToJoinHearing = false;
            expect(component.shouldUnmuteForHearing()).toBe(false);
        });

        it('should return true when super.shouldUnmuteForHearing is true hostWantsToJoinHearing is true', () => {
            superShouldUnmuteForHearing.and.returnValue(true);
            component.hostWantsToJoinHearing = true;
            expect(component.shouldUnmuteForHearing()).toBe(true);
        });
    });

    describe('updateSpotlightStateOnParticipantDisconnectDuringConference', () => {
        it('should do nothing if the conference is not in session', () => {
            // Arrange
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue({
                status: ConferenceStatus.Closed
            } as ConferenceResponse);

            // Act
            component.updateSpotlightStateOnParticipantDisconnectDuringConference(participant);

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
        });

        it('should do nothing if the updated participant status is not disconnected', () => {
            // Arrange
            const participant = ParticipantModel.fromParticipantForUserResponse(participantTwo);
            participant.status = ParticipantStatus.Available;
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue({
                status: ConferenceStatus.InSession
            } as ConferenceResponse);

            // Act
            component.updateSpotlightStateOnParticipantDisconnectDuringConference(participant);

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
        });

        it('should set spotlight status of vmr in cache to false if all participants are disconnected', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participants = [
                ParticipantModel.fromParticipantForUserResponse(vmrParticipantOne),
                ParticipantModel.fromParticipantForUserResponse(vmrParticipantTwo)
            ];

            participants[0].status = ParticipantStatus.Disconnected;
            participants[1].status = ParticipantStatus.Disconnected;

            const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[0].virtualMeetingRoomSummary);
            vmr.participants = participants;

            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue([vmr]);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue({
                status: ConferenceStatus.InSession
            } as ConferenceResponse);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            component.updateSpotlightStateOnParticipantDisconnectDuringConference(participants[0]);

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(vmr.id, false);
        });

        it('should NOT set spotlight status of vmr in cache to false if some participants are in the hearing', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participants = [
                ParticipantModel.fromParticipantForUserResponse(vmrParticipantOne),
                ParticipantModel.fromParticipantForUserResponse(vmrParticipantTwo)
            ];

            participants[0].status = ParticipantStatus.Disconnected;
            participants[1].status = ParticipantStatus.InHearing;

            const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[0].virtualMeetingRoomSummary);
            vmr.participants = participants;

            getSpiedPropertyGetter(participantServiceSpy, 'virtualMeetingRooms').and.returnValue([vmr]);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue({
                status: ConferenceStatus.InSession
            } as ConferenceResponse);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            component.updateSpotlightStateOnParticipantDisconnectDuringConference(participants[0]);

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
        });

        it('should set spotlight status of participant if they are not a member of a VMR', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participant = ParticipantModel.fromParticipantForUserResponse(participantTwo);
            participant.status = ParticipantStatus.Disconnected;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue({
                status: ConferenceStatus.InSession
            } as ConferenceResponse);
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            component.updateSpotlightStateOnParticipantDisconnectDuringConference(participant);

            // Assert
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(participant.id, false);
        });

        it('should return hostWantsToJoinHearing false when leave hearing button has been clicked', () => {
            component.leaveHearing();
            expect(component.hostWantsToJoinHearing).toBeFalse();
        });
    });

    describe('joinHearingClicked', () => {
        beforeEach(() => {
            videoCallService.joinHearingInSession.calls.reset();
        });

        it('should display join hearing popup when mute microphone feature is enabled', fakeAsync(() => {
            launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
            component.ngOnInit();
            tick();
            expect(component.isMuteMicrophoneEnabled).toBeTruthy();
            component.joinHearingClicked();
            expect(component.displayJoinHearingPopup).toBeTruthy();
        }));

        it('should join hearing when mute microphone feature is disabled', fakeAsync(() => {
            launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(false));
            component.ngOnInit();
            tick();
            expect(component.isMuteMicrophoneEnabled).toBeFalsy();
            component.joinHearingClicked();
            expect(videoCallService.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
        }));
    });

    describe('onJoinConfirmAnswered', () => {
        beforeEach(() => {
            videoCallService.joinHearingInSession.calls.reset();
        });

        it('should join hearing when answer is true', () => {
            component.onJoinConfirmAnswered(true);
            expect(videoCallService.joinHearingInSession).toHaveBeenCalledWith(component.conferenceId, component.participant.id);
            expect(component.displayJoinHearingPopup).toBeFalsy();
        });

        it('should not join hearing when answer is false', () => {
            component.onJoinConfirmAnswered(false);
            expect(videoCallService.joinHearingInSession).toHaveBeenCalledTimes(0);
            expect(component.displayJoinHearingPopup).toBeFalsy();
        });
    });
});
