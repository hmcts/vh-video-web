import { of, throwError } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
import {
    ApiClient,
    BadModel,
    BadRequestModelResponse,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    PrivateAdminConsultationRequest,
    PrivateConsultationRequest,
    PrivateVideoEndpointConsultationRequest,
    RoomType
} from '../clients/api-client';
import { ModalService } from '../modal.service';
import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
    let apiClient: jasmine.SpyObj<ApiClient>;
    let modalService: jasmine.SpyObj<ModalService>;
    let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;
    const logger = new MockLogger();
    let service: ConsultationService;
    let timeout: jasmine.SpyObj<NodeJS.Timer>;

    beforeAll(() => {
        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['add', 'remove', 'open', 'close', 'closeAll']);
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'handleConsultationRequest',
            'leavePrivateConsultation',
            'respondToAdminConsultationRequest',
            'callVideoEndpoint'
        ]);

        notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'initConsultationRequestRingtone',
            'playConsultationRequestRingtone',
            'stopConsultationRequestRingtone'
        ]);
    });

    beforeEach(() => {
        apiClient.handleConsultationRequest.and.returnValue(of());
        apiClient.leavePrivateConsultation.and.returnValue(of());
        apiClient.respondToAdminConsultationRequest.and.returnValue(of());
        apiClient.callVideoEndpoint.and.returnValue(of());

        timeout = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
        spyOn(global, 'setTimeout').and.returnValue(<any>timeout);

        service = new ConsultationService(apiClient, modalService, notificationSoundsService, logger);

        modalService.closeAll.calls.reset();
        modalService.open.calls.reset();
        modalService.close.calls.reset();
        modalService.closeAll.calls.reset();
        apiClient.handleConsultationRequest.calls.reset();

        notificationSoundsService.initConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
    });

    it('should expect timeout to be 2 minutes', () => {
        expect(service.CALL_TIMEOUT).toBe(120000);
    });

    it('should display request modal and start ringing when raising a request for consulation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id
        });
        await service.raiseConsultationRequest(conference, requester, requestee);

        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.REQUEST_PC_MODAL);
        expect(service.waitingForConsultationResponse).toBeTruthy();
        expect(service.callRingingTimeout).toBe(timeout);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('shoul stop rining, clear modals and cancel request on cancellation', async () => {
        service.callRingingTimeout = timeout;
        service.waitingForConsultationResponse = true;
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Cancelled
        });

        await service.cancelConsultationRequest(conference, requester, requestee);

        expect(service.callRingingTimeout).toBeNull();
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(modalService.closeAll).toHaveBeenCalled();
        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
    });

    it('should stop ringing when responding to a request for consulation with "Accepted"', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Accepted
        });
        service.waitingForConsultationResponse = true;
        service.callRingingTimeout = timeout;

        await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);

        expect(service.waitingForConsultationResponse).toBeFalsy();
        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(service.callRingingTimeout).toBeNull();
    });

    it('should stop ringing when responding to a request for consulation with "Rejected"', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Rejected
        });
        service.waitingForConsultationResponse = true;
        service.callRingingTimeout = timeout;

        await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Rejected);

        expect(service.waitingForConsultationResponse).toBeFalsy();
        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(service.callRingingTimeout).toBeNull();
    });

    it('should display accepted PC modal on "Accepted"', () => {
        service.callRingingTimeout = timeout;
        service.handleConsultationResponse(ConsultationAnswer.Accepted);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ACCEPTED_PC_MODAL);
    });

    it('should display accepted PC modal on "Rejected"', () => {
        service.callRingingTimeout = timeout;
        service.handleConsultationResponse(ConsultationAnswer.Rejected);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.REJECTED_PC_MODAL);
    });

    it('should clear modals on screen on "Cancelled"', () => {
        service.callRingingTimeout = timeout;
        service.handleConsultationResponse(ConsultationAnswer.Cancelled);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.closeAll).toHaveBeenCalledTimes(1);
        expect(modalService.open).toHaveBeenCalledTimes(0);
    });

    it('should leave a consultation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];

        const request = new LeavePrivateConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id
        });

        await service.leaveConsultation(conference, participant);

        expect(apiClient.leavePrivateConsultation).toHaveBeenCalledWith(request);
    });

    it('should respond to an admin consultation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];
        const answer = ConsultationAnswer.Accepted;
        const room = RoomType.ConsultationRoom1;
        const request = new PrivateAdminConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id,
            answer,
            consultation_room: room
        });

        await service.respondToAdminConsultationRequest(conference, participant, answer, room);

        expect(apiClient.respondToAdminConsultationRequest).toHaveBeenCalledWith(request);
    });

    it('should display error modal when unexpected admin consultation error occurs', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];
        const answer = ConsultationAnswer.Accepted;
        const room = RoomType.ConsultationRoom1;
        const request = new PrivateAdminConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id,
            answer,
            consultation_room: room
        });
        service.callRingingTimeout = timeout;
        apiClient.respondToAdminConsultationRequest.and.callFake(() => throwError(error));

        await expectAsync(
            service.respondToAdminConsultationRequest(conference, participant, ConsultationAnswer.Accepted, room)
        ).toBeRejectedWith(error);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should display no consultation room modal when admin consultation has been accepted but no rooms left', async () => {
        const error = new BadRequestModelResponse({
            errors: Array(
                new BadModel({
                    title: 'ConsultationRoom',
                    errors: Array('No consultation room available')
                })
            )
        });
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];
        const answer = ConsultationAnswer.Accepted;
        const room = RoomType.ConsultationRoom1;
        const request = new PrivateAdminConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id,
            answer,
            consultation_room: room
        });
        service.callRingingTimeout = timeout;
        apiClient.respondToAdminConsultationRequest.and.callFake(() => throwError(error));

        await service.respondToAdminConsultationRequest(conference, participant, ConsultationAnswer.Accepted, room);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.NO_ROOM_PC_MODAL);
    });

    it('should display no consultation room modal when consultation has been accepted but no rooms left', async () => {
        const error = new BadRequestModelResponse({
            errors: Array(
                new BadModel({
                    title: 'ConsultationRoom',
                    errors: Array('No consultation room available')
                })
            )
        });
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];
        service.callRingingTimeout = timeout;
        apiClient.handleConsultationRequest.and.callFake(() => throwError(error));

        await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.NO_ROOM_PC_MODAL);
    });

    it('should display error modal when unexpected consultation error occurs', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];
        service.callRingingTimeout = timeout;
        apiClient.handleConsultationRequest.and.callFake(() => throwError(error));

        await expectAsync(
            service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted)
        ).toBeRejectedWith(error);

        expect(service.callRingingTimeout).toBeNull();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should set waitingForConsultationResponse to false when reset', () => {
        service.waitingForConsultationResponse = true;
        service.resetWaitingForResponse();
        expect(service.waitingForConsultationResponse).toBeFalsy();
    });

    it('should do nothing when timeout expires and user is not expecting a response', async () => {
        service.waitingForConsultationResponse = false;
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        await service.cancelTimedOutConsultationRequest(conference, requester, requestee);

        expect(apiClient.handleConsultationRequest).toHaveBeenCalledTimes(0);
    });

    it('should stop ringing and display rejected modal on outgoing call timeout', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Cancelled
        });
        service.waitingForConsultationResponse = true;
        service.callRingingTimeout = timeout;

        await service.cancelTimedOutConsultationRequest(conference, requester, requestee);
        expect(service.waitingForConsultationResponse).toBeFalsy();
        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
        expect(service.callRingingTimeout).toBeFalsy();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.REJECTED_PC_MODAL);
    });

    it('should stop call ringing and clear modals on incoming call timeout', () => {
        service.cancelTimedOutIncomingRequest();

        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(modalService.closeAll).toHaveBeenCalled();
    });

    it('should display receieving call modal and start ringing when request is received', () => {
        service.displayIncomingPrivateConsultation();

        expect(service.waitingForConsultationResponse).toBeFalsy();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.RECEIVE_PC_MODAL);
        expect(service.callRingingTimeout).toBe(timeout);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should display admin consulation modal and start ringing', () => {
        service.displayAdminConsultationRequest();

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.VHO_REQUEST_PC_MODAL);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalled();
        expect(service.callRingingTimeout).toBe(timeout);
    });

    it('should call api to start private consultation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const endpoint = conference.endpoints[0];
        const request = new PrivateVideoEndpointConsultationRequest({
            conference_id: conference.id,
            endpoint_id: endpoint.id
        });
        await service.startPrivateConsulationWithEndpoint(conference, endpoint);
        expect(apiClient.callVideoEndpoint).toHaveBeenCalledWith(request);
    });

    it('should display no consultation room modal when endpoint consultation has been requested but no rooms left', async () => {
        const error = new BadRequestModelResponse({
            errors: Array(
                new BadModel({
                    title: 'ConsultationRoom',
                    errors: Array('No consultation room available')
                })
            )
        });
        apiClient.callVideoEndpoint.and.callFake(() => throwError(error));
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const endpoint = conference.endpoints[0];

        await service.startPrivateConsulationWithEndpoint(conference, endpoint);

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.NO_ROOM_PC_MODAL);
    });

    it('should display error modal when endpoint consultation has been requested throw unexpected error', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const endpoint = conference.endpoints[0];
        apiClient.callVideoEndpoint.and.callFake(() => throwError(error));

        await expectAsync(service.startPrivateConsulationWithEndpoint(conference, endpoint)).toBeRejectedWith(error);

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });
});
