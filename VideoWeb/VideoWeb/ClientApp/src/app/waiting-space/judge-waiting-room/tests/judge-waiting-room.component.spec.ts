import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
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
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    userMediaService,
    userMediaStreamService,
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
import { Observable } from 'rxjs';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { VirtualMeetingRoomModel } from 'src/app/services/conference/models/virtual-meeting-room.model';
import { HearingRole } from '../../models/hearing-role-model';

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

    let component: JudgeWaitingRoomComponent;
    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;
    let activatedRoute: ActivatedRoute;
    let logged: LoggedParticipantResponse;
    const translateService = translateServiceSpy;
    let consultationInvitiation: ConsultationInvitation;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoControlServiceSpy: jasmine.SpyObj<VideoControlService>;
    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;

    beforeAll(() => {
        initAllWRDependencies();
        audioRecordingService = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', ['getAudioStreamInfo']);
    });

    beforeEach(async () => {
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
        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', ['setSpotlightStatus']);

        userMediaService.setDefaultDevicesInCache.and.returnValue(Promise.resolve());
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
            audioRecordingService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            translateService,
            consultationInvitiationService,
            conferenceServiceSpy,
            participantServiceSpy,
            videoControlServiceSpy,
            videoControlCacheServiceSpy
        );

        consultationInvitiationService.getInvitation.and.returnValue(consultationInvitiation);

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
        notificationToastrService.showAudioRecordingError.calls.reset();
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should init hearing alert and setup Client', fakeAsync(() => {
        videoWebService.getJwToken.calls.reset();
        component.ngOnInit();
        flushMicrotasks();
        tick(100);
        expect(component.eventHubSubscription$).toBeDefined();
        expect(videoWebService.getJwToken).toHaveBeenCalledTimes(1);
    }));
    it('should handle error when unable to setup default devices', fakeAsync(() => {
        errorService.handlePexipError.calls.reset();
        const error = new Error('Permission error');
        userMediaService.setDefaultDevicesInCache.and.rejectWith(error);
        component.ngOnInit();
        flushMicrotasks();
        expect(errorService.handlePexipError).toHaveBeenCalledTimes(1);
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

    it('should handle error when get conference fails', async () => {
        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);
        await component.getConference();
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should start the hearing', async () => {
        const layout = HearingLayout.TwoPlus21;
        videoCallService.getPreferredLayout.and.returnValue(layout);
        await component.startHearing();
        expect(videoCallService.startHearing).toHaveBeenCalledWith(component.conference.id, layout);
    });

    it('should handle api error when start hearing fails', async () => {
        const error = { status: 500, isApiException: true };
        videoCallService.startHearing.and.returnValue(Promise.reject(error));
        const layout = HearingLayout.TwoPlus21;
        videoCallService.getPreferredLayout.and.returnValue(layout);
        await component.startHearing();
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should continue with no recording when judge dismisses the audio recording alert mid hearing', async () => {
        const toast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', { actioned: true });
        notificationToastrService.showAudioRecordingError.and.returnValue(toast);
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);

        component.continueWithNoRecordingCallback();

        expect(component.audioErrorToastOpen).toBeFalsy();
        expect(component.continueWithNoRecording).toBeTruthy();
    });

    it('should only display one toast for audio recording issues', async () => {
        const toast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', { actioned: true });
        notificationToastrService.showAudioRecordingError.and.returnValue(toast);
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;

        await component.retrieveAudioStreamInfo(globalConference.id);
        await component.retrieveAudioStreamInfo(globalConference.id);

        expect(component.audioErrorToastOpen).toBeTruthy();
        expect(notificationToastrService.showAudioRecordingError).toHaveBeenCalledTimes(1);
    });

    it('should update toast visibility variable on auto dimiss ', async () => {
        const toast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', { actioned: false });
        toast.actioned = false;
        notificationToastrService.showAudioRecordingError.and.returnValue(toast);
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);
        component.continueWithNoRecording = false;

        component.continueWithNoRecordingCallback();

        expect(component.audioErrorToastOpen).toBeFalsy();
        expect(component.continueWithNoRecording).toBeFalsy();
    });

    it('should display audio recording alert when audio info throws an error and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeTruthy();
        expect(notificationToastrService.showAudioRecordingError).toHaveBeenCalled();
        expect(audioRecordingService.getAudioStreamInfo).toHaveBeenCalled();
    });

    it('should not display audio recording alert before 60 seconds has passed', async () => {
        audioRecordingService.getAudioStreamInfo.calls.reset();
        component.conferenceRecordingInSessionForSeconds = 0;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeFalsy();
        expect(notificationToastrService.showAudioRecordingError).not.toHaveBeenCalled();
        expect(audioRecordingService.getAudioStreamInfo).not.toHaveBeenCalled();
    });

    it('should not preform audio recording check if continuing with no recording', async () => {
        audioRecordingService.getAudioStreamInfo.calls.reset();
        component.conferenceRecordingInSessionForSeconds = 100;
        component.conference.status = ConferenceStatus.InSession;
        component.continueWithNoRecording = true;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeFalsy();
        expect(notificationToastrService.showAudioRecordingError).not.toHaveBeenCalled();
        expect(audioRecordingService.getAudioStreamInfo).not.toHaveBeenCalled();
    });

    it('should not preform audio recording check if hearing isnt InSession', async () => {
        audioRecordingService.getAudioStreamInfo.calls.reset();
        component.conferenceRecordingInSessionForSeconds = 100;
        component.conference.status = ConferenceStatus.Paused;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeFalsy();
        expect(notificationToastrService.showAudioRecordingError).toHaveBeenCalledTimes(0);
        expect(audioRecordingService.getAudioStreamInfo).not.toHaveBeenCalled();
    });

    it('should reset notification state if hearing status not InSession', async () => {
        audioRecordingService.getAudioStreamInfo.calls.reset();
        component.conferenceRecordingInSessionForSeconds = 100;
        component.conference.status = ConferenceStatus.Paused;
        component.audioErrorToastOpen = true;
        component.continueWithNoRecording = true;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.continueWithNoRecording).toBeFalsy();
        expect(audioRecordingService.getAudioStreamInfo).not.toHaveBeenCalled();
    });

    it('should display audio recording alert when audio info throws an error and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.continueWithNoRecording = false;
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeTruthy();
    });

    it('should not display audio recording alert when audio info returns true', async () => {
        audioRecordingService.getAudioStreamInfo.and.returnValue(Promise.resolve(true));
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeFalsy();
    });

    it('should display audio recording alert when audio info returns false and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.returnValue(Promise.resolve(false));
        component.continueWithNoRecording = false;
        component.conferenceRecordingInSessionForSeconds = 61;
        component.conference.status = ConferenceStatus.InSession;
        component.showVideo = true;
        await component.retrieveAudioStreamInfo(globalConference.id);
        expect(component.audioErrorToastOpen).toBeTruthy();
    });

    describe('conferenceRecordingInSessionForSeconds property', () => {
        const currentConferenceRecordingInSessionForSeconds = 10;
        const currentAudioRecordingStreamCheckIntervalSeconds = 30;

        beforeEach(() => {
            audioRecordingService.getAudioStreamInfo.and.returnValue(Promise.resolve(false));
            component.continueWithNoRecording = false;
            component.conferenceRecordingInSessionForSeconds = currentConferenceRecordingInSessionForSeconds;
            component.audioRecordingStreamCheckIntervalSeconds = currentAudioRecordingStreamCheckIntervalSeconds;
        });

        it('should accumulate when conference is in session', async () => {
            component.conference.status = ConferenceStatus.InSession;
            await component.retrieveAudioStreamInfo(globalConference.id);
            expect(component.conferenceRecordingInSessionForSeconds).toBe(
                currentConferenceRecordingInSessionForSeconds + currentAudioRecordingStreamCheckIntervalSeconds
            );
        });

        it('should reset when conference is not in session', async () => {
            component.conference.status = ConferenceStatus.Paused;
            await component.retrieveAudioStreamInfo(globalConference.id);
            expect(component.conferenceRecordingInSessionForSeconds).toBe(0);
        });

        it('should switch the continueWithNoRecording flag to false when conference is not in session', async () => {
            component.conference.status = ConferenceStatus.Paused;
            component.continueWithNoRecording = true;
            await component.retrieveAudioStreamInfo(globalConference.id);
            expect(component.continueWithNoRecording).toBe(false);
        });

        it('should not switch the continueWithNoRecording flag when conference is in session', async () => {
            component.conference.status = ConferenceStatus.InSession;
            component.continueWithNoRecording = true;
            await component.retrieveAudioStreamInfo(globalConference.id);
            expect(component.continueWithNoRecording).toBe(true);
        });
    });

    it('should init audio recording interval', () => {
        spyOn(component, 'retrieveAudioStreamInfo');
        component.initAudioRecordingInterval();
        expect(component.audioRecordingInterval).toBeDefined();
    });
    it('should display change device popup', () => {
        component.displayDeviceChangeModal = false;
        component.showChooseCameraDialog();
        expect(component.displayDeviceChangeModal).toBe(true);
    });

    it('should on consultation accept stop streams for devices and close choose device popup', async () => {
        component.displayDeviceChangeModal = true;
        await component.onConsultationAccepted('');
        expect(component.displayDeviceChangeModal).toBe(false);
        expect(userMediaStreamService.getStreamForMic).toHaveBeenCalled();
        expect(userMediaStreamService.getStreamForCam).toHaveBeenCalled();
        expect(userMediaStreamService.stopStream).toHaveBeenCalled();
    });
    it('should hide change device popup on close popup', () => {
        component.displayDeviceChangeModal = true;
        component.onMediaDeviceChangeCancelled();
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
        videoCallService.getPreferredLayout.calls.reset();

        component.displayConfirmStartHearingPopup = true;
        videoCallService.startHearing.calls.reset();
        videoCallService.startHearing.and.resolveTo();

        const conferenceId = Guid.create().toString();
        component.conference.id = conferenceId;
        spyOnProperty(component, 'conferenceId', 'get').and.returnValue(conferenceId);

        const hearingLayout = HearingLayout.Dynamic;
        videoCallService.getPreferredLayout.and.returnValue(hearingLayout);

        const hearingId = Guid.create();
        spyOnProperty(component.hearing, 'id', 'get').and.returnValue(hearingId);

        // Act
        component.onStartConfirmAnswered(true);
        flush();

        // Assert
        expect(videoCallService.getPreferredLayout).toHaveBeenCalledOnceWith(conferenceId);
        expect(component.displayConfirmStartHearingPopup).toBeFalsy();
        expect(videoCallService.startHearing).toHaveBeenCalledOnceWith(hearingId, hearingLayout);
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
            expect(videoControlServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(judgeParticipant, true);
            expect(videoControlServiceSpy.restoreParticipantsSpotlight).toHaveBeenCalledTimes(nonJudgeParticipants.length + vmrs.length);
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
    });
});
