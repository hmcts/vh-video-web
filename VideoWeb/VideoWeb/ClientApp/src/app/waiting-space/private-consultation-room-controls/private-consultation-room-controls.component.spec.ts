import { Guid } from 'guid-typescript';
import { ConferenceResponse, ParticipantStatus, Role, RoomSummaryResponse } from 'src/app/services/clients/api-client';
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
} from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ConnectedScreenshare, ParticipantUpdated, StoppedScreenshare } from '../models/video-call-models';
import { deviceTypeService } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { PrivateConsultationRoomControlsComponent } from './private-consultation-room-controls.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';

describe('PrivateConsultationRoomControlsComponent', () => {
    let component: PrivateConsultationRoomControlsComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;

    const videoCallService = videoCallServiceSpy;
    const onParticipantUpdatedSubject = onParticipantUpdatedMock;
    const onScreenshareConnectedSubject = onScreenshareConnectedMock;
    const onScreenshareStoppedSubject = onScreenshareStoppedMock;

    const logger: Logger = new MockLogger();

    const testData = new VideoCallTestData();
    const translateService = translateServiceSpy;

    beforeEach(() => {
        translateService.instant.calls.reset();
        component = new PrivateConsultationRoomControlsComponent(
            videoCallService,
            eventsService,
            deviceTypeService,
            logger,
            translateService
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

    it('should close self-view by default for non judge participants', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeFalsy();
    });

    it('should raise hand on toggle if hand not raised', () => {
        videoCallService.raiseHand.calls.reset();
        component.handRaised = false;
        component.toggleHandRaised();
        expect(videoCallService.raiseHand).toHaveBeenCalledTimes(1);
        const expectedText = 'Lower my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should lower hand on toggle if hand raised', () => {
        videoCallService.lowerHand.calls.reset();
        component.handRaised = true;
        component.toggleHandRaised();
        expect(videoCallService.lowerHand).toHaveBeenCalledTimes(1);
        const expectedText = 'Raise my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
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
        const expectedText = 'Switch camera off';
        translateServiceSpy.instant.and.returnValues(expectedText);
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
        const expectedText = 'Switch camera on';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.videoMutedText).toBe(expectedText);
    });

    it('should show raised hand on hand lowered', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'Raise my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should show remote muted when muted by host', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.remoteMuted).toBeTruthy();
    });

    it('should not show raised hand on hand lowered for another participant', () => {
        const otherParticipant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        const pexipParticipant = testData.getExamplePexipParticipant(otherParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'YES';
        pexipParticipant.buzz_time = 0;
        pexipParticipant.spotlight = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.handRaised = true;
        component.remoteMuted = false;
        onParticipantUpdatedSubject.next(payload);
        expect(component.remoteMuted).toBeFalsy();
        expect(component.handRaised).toBeTruthy();
        const expectedText = 'Lower my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should show lower hand on hand raised', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeTruthy();
        const expectedText = 'Lower my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should not show lower hand when hand raised for another participant', () => {
        const otherParticipant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        const pexipParticipant = testData.getExamplePexipParticipant(otherParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        component.handRaised = false;
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'Raise my hand';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should mute locally if remote muted and not muted locally', () => {
        videoCallService.toggleMute.calls.reset();
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.audioMuted = false;

        component.handleParticipantUpdatedInVideoCall(payload);

        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(1);
    });

    it('should skip mute locally if remote muted and already muted locally', () => {
        videoCallService.toggleMute.calls.reset();
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.is_muted = 'Yes';
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        component.audioMuted = true;
        component.handleParticipantUpdatedInVideoCall(payload);
        expect(videoCallService.toggleMute).toHaveBeenCalledTimes(0);
    });

    it('should not reset mute when participant status to available', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.display_name, gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should reset mute when participant status to in consultation', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, participant.display_name, gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalled();
    });

    it('should ignore participant updates for another participant', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        const message = new ParticipantStatusMessage(participant.id, participant.display_name, gloalConference.id, status);

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
        component.participant.current_room = new RoomSummaryResponse({ label: 'JudgeJOHCourtRoom' });

        expect(component.isJOHRoom).toBe(true);
    });
    it('should confirm that the consultation room is not a judge and JOH court room', async () => {
        component.participant = globalParticipant;
        component.participant.current_room = new RoomSummaryResponse({ label: 'ParticipantCourtRoom' });

        expect(component.isJOHRoom).toBe(false);
    });
});
