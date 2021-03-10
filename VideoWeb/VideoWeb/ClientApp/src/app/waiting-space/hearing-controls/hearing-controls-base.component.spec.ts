import { Guid } from 'guid-typescript';
import { ConferenceResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantRemoteMuteMessage } from 'src/app/shared/models/participant-remote-mute-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallTestData } from 'src/app/testing/mocks/data/video-call-test-data';
import {
    eventsServiceSpy,
    hearingCountdownCompleteSubjectMock,
    participantHandRaisedStatusSubjectMock,
    participantRemoteMuteStatusSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { onParticipantUpdatedMock, videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { HearingRole } from '../models/hearing-role-model';
import { ParticipantUpdated } from '../models/video-call-models';
import { PrivateConsultationRoomControlsComponent } from '../private-consultation-room-controls/private-consultation-room-controls.component';
import { HearingControlsBaseComponent } from './hearing-controls-base.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';

describe('HearingControlsBaseComponent', () => {
    let component: HearingControlsBaseComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;

    const videoCallService = videoCallServiceSpy;
    const onParticipantUpdatedSubject = onParticipantUpdatedMock;
    const translateService = translateServiceSpy;

    const deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', [
        'getBrowserName',
        'getBrowserVersion',
        'isSupportedBrowser',
        'isIpad',
        'isTablet'
    ]);

    const logger: Logger = new MockLogger();

    const testData = new VideoCallTestData();

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
        component.isPrivateConsultation = false;
        component.setupEventhubSubscribers();
        component.setupVideoCallSubscribers();
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

    it('should ensure participant is unmuted when in a private consultation', () => {
        videoCallService.toggleMute.calls.reset();
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.isPrivateConsultation = true;
        component.audioMuted = true;
        component.initialiseMuteStatus();
        expect(videoCallService.toggleMute).toHaveBeenCalled();
    });

    it('should close self-view by default for non judge participants', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Individual);
        component.ngOnInit();
        expect(component.selfViewOpen).toBeFalsy();
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
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeFalsy();
        const expectedText = 'hearing-controls.raise-my-hand';
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
        const expectedText = 'hearing-controls.lower-my-hand';
        expect(component.handToggleText).toBe(expectedText);
    });

    it('should process hand raised message for participant', () => {
        component.handRaised = false;
        const payload = new ParticipantHandRaisedMessage(gloalConference.id, globalParticipant.id, true);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeTruthy();
    });

    it('should process hand lowered message for participant', () => {
        component.handRaised = true;
        const payload = new ParticipantHandRaisedMessage(gloalConference.id, globalParticipant.id, false);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeFalsy();
    });

    it('should not process hand raised message for another participant', () => {
        component.handRaised = false;
        const payload = new ParticipantHandRaisedMessage(gloalConference.id, Guid.create().toString(), true);

        participantHandRaisedStatusSubjectMock.next(payload);

        expect(component.handRaised).toBeFalsy();
    });

    it('should process remote mute message for participant', () => {
        component.remoteMuted = false;
        const payload = new ParticipantRemoteMuteMessage(gloalConference.id, globalParticipant.id, true);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeTruthy();
    });

    it('should process remote unnmute message for participant', () => {
        component.remoteMuted = true;
        const payload = new ParticipantRemoteMuteMessage(gloalConference.id, globalParticipant.id, false);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeFalsy();
    });

    it('should not process remote mute message for another participant', () => {
        component.remoteMuted = false;
        const payload = new ParticipantRemoteMuteMessage(gloalConference.id, Guid.create().toString(), true);

        participantRemoteMuteStatusSubjectMock.next(payload);

        expect(component.remoteMuted).toBeFalsy();
    });

    it('should show lower hand on hand raised', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(globalParticipant.tiled_display_name);
        pexipParticipant.buzz_time = 123;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        onParticipantUpdatedSubject.next(payload);
        expect(component.handRaised).toBeTruthy();
        const expectedText = 'hearing-controls.lower-my-hand';

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
        const expectedText = 'hearing-controls.raise-my-hand';
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
        const message = new ParticipantStatusMessage(globalParticipant.id, '', gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalledTimes(0);
    });

    it('should reset mute when participant status to in consultation', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, '', gloalConference.id, status);

        participantStatusSubject.next(message);

        expect(component.resetMute).toHaveBeenCalled();
    });

    it('should ignore participant updates for another participant', () => {
        spyOn(component, 'resetMute').and.callThrough();
        const status = ParticipantStatus.InConsultation;
        const participant = gloalConference.participants.filter(x => x.role === Role.Representative)[0];
        const message = new ParticipantStatusMessage(participant.id, '', gloalConference.id, status);

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

    it('should indicates that it is the JOH consultation and returns true if participant is JOH or Judge', () => {
        component.participant = gloalConference.participants.find(x => x.role === Role.Judge);
        expect(component.isJOHConsultation).toBe(true);
    });

    it(`canShowScreenShareButton() should return "false" when device is a tablet`, () => {
        deviceTypeService.isTablet.and.returnValue(true);
        component.ngOnInit();
        expect(component.canShowScreenShareButton).toBeFalsy();
    });

    it(`canShowScreenShareButton() should cover all HearingRole's when showing/hiding the "share screen" button`, () => {
        const enumCount = Object.keys(HearingRole).length;
        const numberBeingTested = allowedHearingRoles.length + nonAllowedHearingRoles.length;
        expect(numberBeingTested).toBe(enumCount);
    });

    const allowedHearingRoles = [
        HearingRole.APPELLANT,
        HearingRole.DEFENCE_ADVOCATE,
        HearingRole.EXPERT,
        HearingRole.INTERPRETER,
        HearingRole.JUDGE,
        HearingRole.MACKENZIE_FRIEND,
        HearingRole.OBSERVER,
        HearingRole.PANEL_MEMBER,
        HearingRole.PROSECUTION,
        HearingRole.PROSECUTION_ADVOCATE,
        HearingRole.REPRESENTATIVE,
        HearingRole.WINGER,
        HearingRole.LITIGANT_IN_PERSON
    ];
    allowedHearingRoles.forEach(hearingRole => {
        it(`canShowScreenShareButton() should return "true" when device is not a tablet and user has the '${hearingRole}' HearingRole`, () => {
            deviceTypeService.isTablet.and.returnValue(false);
            component.participant.hearing_role = hearingRole;
            component.ngOnInit();
            expect(component.canShowScreenShareButton).toBeTruthy();
        });
    });

    const nonAllowedHearingRoles = [HearingRole.WITNESS];
    nonAllowedHearingRoles.forEach(hearingRole => {
        it(`canShowScreenShareButton() should return "false" when device is not a tablet and user has the '${hearingRole}' HearingRole`, () => {
            deviceTypeService.isTablet.and.returnValue(false);
            component.participant.hearing_role = hearingRole;
            component.ngOnInit();
            expect(component.canShowScreenShareButton).toBeFalsy();
        });
    });
});
