import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    HearingLayout,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus
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
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { Subject } from 'rxjs';
import { Guid } from 'guid-typescript';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { VideoCallService } from '../../services/video-call.service';
import { VideoControlService } from 'src/app/services/conference/video-control.service';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;
    let activatedRoute: ActivatedRoute;
    let logged: LoggedParticipantResponse;
    const translateService = translateServiceSpy;
    let consultationInvitiation: ConsultationInvitation;
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoControlServiceSpy: jasmine.SpyObj<VideoControlService>;

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

        participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['getPexipIdForParticipant']);
        videoControlServiceSpy = jasmine.createSpyObj<VideoControlService>('VideoControlService', ['getSpotlightedParticipants']);

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
            participantServiceSpy,
            videoControlServiceSpy
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

    fit('should NOT start hearing when confirmation answered no', fakeAsync(() => {
        // Arrange
        component.displayConfirmStartHearingPopup = true;
        const restoreSpotlightedParticipantsSpy = spyOn(component, 'restoreSpotlightedParticipants');
        videoCallService.startHearing.calls.reset();
        videoCallService.startHearing.and.resolveTo();

        // Act
        component.onStartConfirmAnswered(false);
        flush();

        // Assert
        expect(component.displayConfirmStartHearingPopup).toBeFalsy();
        expect(videoCallService.startHearing).not.toHaveBeenCalled();
        expect(component.restoreSpotlightedParticipants).not.toHaveBeenCalled();
    }));

    fit('should start hearing when confirmation answered yes', fakeAsync(() => {
        // Arrange
        component.displayConfirmStartHearingPopup = true;
        const restoreSpotlightedParticipantsSpy = spyOn(component, 'restoreSpotlightedParticipants');
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
        expect(component.restoreSpotlightedParticipants).toHaveBeenCalledTimes(1);
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

    describe('spotlight judge when hearing is started', () => {
        it('should spotlight the judge when starting a hearing', () => {});

        it('should NOT spotlight the judge when resuming a hearing', () => {});
    });

    fdescribe('restoreSpotlightedParticipants', () => {
        beforeEach(() => {
            videoCallService.spotlightParticipant.calls.reset();
            videoControlServiceSpy.getSpotlightedParticipants.calls.reset();
        });

        it('should spotlight all participants that are retrived from videoControlServiceSpy.restoreSpotlightedParticipants()', fakeAsync(() => {
            // Arrange
            const conferenceId = Guid.create().toString();
            const participantOneId = Guid.create().toString();
            const participantTwoId = Guid.create().toString();
            const participantOnePexipId = Guid.create().toString();
            const participantTwoPexipId = Guid.create().toString();

            component.conference.id = conferenceId;

            participantServiceSpy.getPexipIdForParticipant.and.callFake(id => {
                switch (id.toString()) {
                    default:
                        return Guid.EMPTY;

                    case participantOneId:
                        return participantOnePexipId;

                    case participantTwoId:
                        return participantTwoPexipId;
                }
            });

            const spotlightedParticipantsSubject = new Subject<string[]>();
            videoControlServiceSpy.getSpotlightedParticipants.and.returnValue(spotlightedParticipantsSubject.asObservable());

            // Act
            component.restoreSpotlightedParticipants();
            spotlightedParticipantsSubject.next([participantOneId.toString(), participantTwoId.toString()]);

            flush();

            // Assert
            expect(videoControlServiceSpy.getSpotlightedParticipants).toHaveBeenCalledOnceWith(conferenceId);
            expect(videoCallService.spotlightParticipant).toHaveBeenCalledTimes(2);
            expect(videoCallService.spotlightParticipant).toHaveBeenCalledWith(participantOnePexipId, true, conferenceId, participantOneId);
            expect(videoCallService.spotlightParticipant).toHaveBeenCalledWith(participantTwoPexipId, true, conferenceId, participantTwoId);
        }));

        it('should NOT spotlight any participants if NONE are retrived from videoControlServiceSpy.restoreSpotlightedParticipants()', fakeAsync(() => {
            // Arrange
            const conferenceId = Guid.create().toString();
            component.conference.id = conferenceId;

            const spotlightedParticipantsSubject = new Subject<string[]>();
            videoControlServiceSpy.getSpotlightedParticipants.and.returnValue(spotlightedParticipantsSubject.asObservable());

            // Act
            component.restoreSpotlightedParticipants();
            spotlightedParticipantsSubject.next([]);

            flush();

            // Assert
            expect(videoControlServiceSpy.getSpotlightedParticipants).toHaveBeenCalledOnceWith(conferenceId);
            expect(videoCallService.spotlightParticipant).not.toHaveBeenCalled();
        }));
    });
});
