import { fakeAsync, tick } from '@angular/core/testing';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomType
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ModalService } from 'src/app/services/modal.service';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    adminConsultationMessageSubjectMock,
    consultationMessageSubjectMock,
    eventsServiceSpy
} from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: ConferenceResponse;
    let consultationRequester: Participant;
    let consultationRequestee: Participant;

    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const consultationSubject = consultationMessageSubjectMock;
    const adminConsultationSubject = adminConsultationMessageSubjectMock;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let modalService: jasmine.SpyObj<ModalService>;
    let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;

    let timer: jasmine.SpyObj<NodeJS.Timer>;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
            'raiseConsultationRequest',
            'respondToConsultationRequest',
            'leaveConsultation',
            'respondToAdminConsultationRequest',
            'displayNoConsultationRoomAvailableModal'
        ]);
        consultationService.raiseConsultationRequest.and.resolveTo();
        consultationService.respondToConsultationRequest.and.resolveTo();
        consultationService.leaveConsultation.and.resolveTo();
        consultationService.respondToAdminConsultationRequest.and.resolveTo();
        consultationService.respondToAdminConsultationRequest.and.resolveTo();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['open', 'closeAll']);

        notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'initConsultationRequestRingtone',
            'playConsultationRequestRingtone',
            'stopConsultationRequestRingtone'
        ]);
        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        consultationRequester = new Participant(conference.participants[0]);
        consultationRequestee = new Participant(conference.participants[1]);

        notificationSoundsService.initConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
        modalService.open.calls.reset();

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new IndividualParticipantStatusListComponent(
            adalService,
            consultationService,
            eventsService,
            modalService,
            logger,
            videoWebService,
            notificationSoundsService
        );

        component.consultationRequester = consultationRequester;
        component.consultationRequestee = consultationRequestee;
        component.conference = conference;
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init properties and setup ringtone on init', () => {
        component.ngOnInit();
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJugdeParticipants).toBeDefined();
        expect(notificationSoundsService.initConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should clear timeout when ringing stops', () => {
        spyOn(global, 'clearTimeout').and.callThrough();
        component.outgoingCallTimeout = timer;
        component.stopCallRinging();
        expect(global.clearTimeout).toHaveBeenCalledWith(timer);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should not cancel outgoing call is user is not waiting for a response', async () => {
        component.waitingForConsultationResponse = false;
        await component.cancelOutgoingCall();
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(0);
    });

    it('should hide request modal and stop ringing when outgoing private consulation has been cancelled', async () => {
        component.waitingForConsultationResponse = true;
        await component.cancelOutgoingCall();

        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Cancelled
        );
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        expect(modalService.open).toHaveBeenCalledWith(IndividualParticipantStatusListComponent.REJECTED_PC_MODAL);
    });

    it('should not be able to call participant is user is judge', () => {
        const judge = component.conference.participants.find(x => x.role === Role.Judge);
        adalService.userInfo.userName = judge.username;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is delayed', () => {
        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should not be able to begin call self', async () => {
        consultationService.raiseConsultationRequest.and.callFake(() => Promise.resolve());
        adalService.userInfo.userName = 'chris.green@hearings.net';
        const participant = conference.participants.find(x => x.username === adalService.userInfo.userName);
        await component.begingCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalledTimes(0);
    });

    it('should be able to begin call with another participant', async () => {
        const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
        participant.status = ParticipantStatus.Available;
        await component.begingCallWith(participant);
        expect(component.waitingForConsultationResponse).toBeTruthy();
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalled();
    });

    it('should not play ringing is raising consultation request to API fails', async () => {
        const error = { error: 'failed to raise test PC' };
        consultationService.raiseConsultationRequest.and.rejectWith(error);
        const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
        participant.status = ParticipantStatus.Available;
        await component.begingCallWith(participant);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(0);
        expect(logger.error.calls.mostRecent().args[0]).toEqual('Failed to raise consultation request');
    });

    it('should answer consultation request', async () => {
        component.waitingForConsultationResponse = true;

        await component.answerConsultationRequest('Accepted');

        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted
        );
    });

    it('should respond to admin consultation with answer "Accepted"', async () => {
        component.consultationRequestee = new Participant(conference.participants[1]);
        const adminConsultationMessage = new AdminConsultationMessage(
            conference.id,
            RoomType.AdminRoom,
            component.consultationRequestee.username,
            null
        );
        component.waitingForConsultationResponse = true;
        component.adminConsultationMessage = adminConsultationMessage;

        await component.acceptVhoConsultationRequest();
        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToAdminConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted,
            adminConsultationMessage.roomType
        );
    });

    it('should do something when answering consultation request fails', async () => {
        logger.error.calls.reset();
        const error = { error: 'test error' };
        consultationService.respondToConsultationRequest.and.rejectWith(error);
        await component.answerConsultationRequest(ConsultationAnswer.Accepted.toString());
        expect(logger.error).toHaveBeenCalled();
    });

    it('should do something when accepting VHO consultation fails', async () => {
        logger.error.calls.reset();
        const error = { error: 'test error' };
        consultationService.respondToAdminConsultationRequest.and.rejectWith(error);
        await component.acceptVhoConsultationRequest();
        expect(logger.error).toHaveBeenCalled();
    });

    it('should display consultation request', () => {
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        const payload = new ConsultationMessage(conference.id, consultationRequester.username, consultationRequestee.username, null);
        consultationSubject.next(payload);

        expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
        expect(component.consultationRequester.id).toEqual(consultationRequester.id);
        // this is an incoming consultation request
        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(component.outgoingCallTimeout).toBeUndefined();
        expect(modalService.open).toHaveBeenCalledWith(IndividualParticipantStatusListComponent.RECIEVE_PC_MODAL);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    it('should cancel consultation request', () => {
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        const payload = new ConsultationMessage(
            conference.id,
            consultationRequester.username,
            consultationRequestee.username,
            ConsultationAnswer.Cancelled
        );
        consultationSubject.next(payload);

        expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
        expect(component.consultationRequester.id).toEqual(consultationRequester.id);
        // this is an incoming consultation request
        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(component.outgoingCallTimeout).toBeNull();
        expect(modalService.closeAll).toHaveBeenCalled();
        expect(modalService.open).toHaveBeenCalledTimes(0);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    const consultationMessageResponseTestCases = [
        { consultationResult: ConsultationAnswer.Accepted, modalId: IndividualParticipantStatusListComponent.ACCEPTED_PC_MODAL },
        { consultationResult: ConsultationAnswer.Rejected, modalId: IndividualParticipantStatusListComponent.REJECTED_PC_MODAL }
    ];

    consultationMessageResponseTestCases.forEach(testCase => {
        it(`should handle ${testCase.consultationResult} messages`, () => {
            component.outgoingCallTimeout = timer;
            component.consultationRequestee = undefined;
            component.consultationRequester = undefined;

            const payload = new ConsultationMessage(
                conference.id,
                consultationRequester.username,
                consultationRequestee.username,
                testCase.consultationResult
            );
            consultationSubject.next(payload);

            expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
            expect(component.consultationRequester.id).toEqual(consultationRequester.id);
            // this is an incoming consultation request
            expect(component.waitingForConsultationResponse).toBeFalsy();
            expect(component.outgoingCallTimeout).toBeNull();
            expect(modalService.open).toHaveBeenCalledWith(testCase.modalId);
            expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        });
    });

    it('should close modals and clear outgoing time when requester cancels call', async () => {
        spyOn(global, 'clearTimeout');
        component.outgoingCallTimeout = timer;

        await component.cancelConsultationRequest();

        expect(modalService.closeAll).toHaveBeenCalled();
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            component.conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Cancelled
        );
        expect(global.clearTimeout).toHaveBeenCalledWith(timer);
        expect(component.outgoingCallTimeout).toBeNull();
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should display VHO consultation request modal when VHO request message is received and participant is available', fakeAsync(() => {
        spyOn(global, 'setTimeout').and.returnValue(timer);
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        const payload = new AdminConsultationMessage(conference.id, RoomType.AdminRoom, consultationRequestee.username, null);
        adminConsultationSubject.next(payload);
        tick();

        expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
        expect(modalService.open).toHaveBeenCalledWith(IndividualParticipantStatusListComponent.VHO_REQUEST_PC_MODAL);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    }));

    it('should not VHO consultation request modal when VHO request message is received and participant is not available', fakeAsync(() => {
        spyOn(global, 'setTimeout').and.returnValue(timer);
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;
        spyOn(component, 'isParticipantAvailable').and.returnValue(false);

        const payload = new AdminConsultationMessage(conference.id, RoomType.AdminRoom, consultationRequestee.username, null);
        adminConsultationSubject.next(payload);
        tick();

        expect(component.consultationRequestee).toBeUndefined();
        expect(modalService.open).toHaveBeenCalledTimes(0);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(0);
    }));

    it('should not take action when VHO consultation response message is received', fakeAsync(() => {
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        const payload = new AdminConsultationMessage(
            conference.id,
            RoomType.AdminRoom,
            consultationRequestee.username,
            ConsultationAnswer.Accepted
        );
        adminConsultationSubject.next(payload);
        tick();

        expect(modalService.open).toHaveBeenCalledTimes(0);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(0);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(0);
    }));

    it('should clear requesters modal and stop call ringing when consultation has been rejected', () => {
        spyOn(global, 'clearTimeout');
        component.outgoingCallTimeout = timer;

        component.closeConsultationRejection();

        expect(modalService.closeAll).toHaveBeenCalled();
        expect(global.clearTimeout).toHaveBeenCalledWith(timer);
        expect(component.outgoingCallTimeout).toBeNull();
        expect(component.waitingForConsultationResponse).toBeFalsy();
    });

    it('should display no consultation room available modal when no room message is received', () => {
        const payload = new ConsultationMessage(
            conference.id,
            consultationRequester.username,
            consultationRequestee.username,
            ConsultationAnswer.NoRoomsAvailable
        );
        consultationService.respondToAdminConsultationRequest.calls.reset();
        consultationSubject.next(payload);

        expect(consultationService.displayNoConsultationRoomAvailableModal).toHaveBeenCalledTimes(1);
    });
});
