import { of, throwError } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    ApiClient,
    BadModel,
    BadRequestModelResponse,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    PrivateAdminConsultationRequest,
    PrivateConsultationRequest,
    RoomType
} from '../clients/api-client';
import { ModalService } from '../modal.service';
import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
    let apiClient: jasmine.SpyObj<ApiClient>;
    let modalService: jasmine.SpyObj<ModalService>;
    let service: ConsultationService;
    beforeAll(() => {
        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['add', 'remove', 'open', 'close', 'closeAll']);
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'handleConsultationRequest',
            'leavePrivateConsultation',
            'respondToAdminConsultationRequest'
        ]);

        apiClient.handleConsultationRequest.and.returnValue(of());
        apiClient.leavePrivateConsultation.and.returnValue(of());
        apiClient.respondToAdminConsultationRequest.and.returnValue(of());
    });

    beforeEach(() => {
        service = new ConsultationService(apiClient, modalService);
        modalService.closeAll.calls.reset();
        modalService.open.calls.reset();
        modalService.close.calls.reset();
    });

    it('should not have an answer when raising a request for consulation', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id
        });
        service.raiseConsultationRequest(conference, requester, requestee);

        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
    });

    it('should have an answer when responding to a request for consulation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Accepted
        });
        await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);

        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
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
        const room = RoomType.WaitingRoom;
        const request = new PrivateAdminConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id,
            answer,
            consultation_room: room
        });

        await service.respondToAdminConsultationRequest(conference, participant, answer, room);

        expect(apiClient.respondToAdminConsultationRequest).toHaveBeenCalledWith(request);
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

        apiClient.handleConsultationRequest.and.callFake(() => throwError(error));

        await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);
        expect(modalService.closeAll).toHaveBeenCalledTimes(1);
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.NO_ROOM_PC_MODAL);
    });

    it('should throw unknown error', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        apiClient.handleConsultationRequest.and.callFake(() => throwError(error));

        expectAsync(service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted)).toBeRejectedWith(
            error
        );

        expect(modalService.closeAll).toHaveBeenCalledTimes(0);
        expect(modalService.open).toHaveBeenCalledTimes(0);
    });
});
