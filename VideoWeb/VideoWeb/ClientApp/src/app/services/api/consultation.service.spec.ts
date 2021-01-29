import { of, throwError } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
import {
    ApiClient,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    PrivateConsultationRequest,
    PrivateVideoEndpointConsultationRequest,
    Role,
    StartPrivateConsultationRequest,
    VirtualCourtRoomType
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
            'respondToConsultationRequest',
            'callVideoEndpoint',
            'startOrJoinConsultation',
            'leaveConsultation'
        ]);

        notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'initConsultationRequestRingtone',
            'playConsultationRequestRingtone',
            'stopConsultationRequestRingtone'
        ]);
    });

    beforeEach(() => {
        apiClient.respondToConsultationRequest.and.returnValue(of());
        apiClient.callVideoEndpoint.and.returnValue(of());
        apiClient.startOrJoinConsultation.and.returnValue(of());
        apiClient.leaveConsultation.and.returnValue(of());

        timeout = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
        spyOn(global, 'setTimeout').and.returnValue(<any>timeout);

        service = new ConsultationService(apiClient, modalService, notificationSoundsService, logger);

        modalService.closeAll.calls.reset();
        modalService.open.calls.reset();
        modalService.close.calls.reset();
        modalService.closeAll.calls.reset();

        notificationSoundsService.initConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
    });

    it('should respond to consultation request stop call ringing and clear modals', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];
        const request = new PrivateConsultationRequest({
            conference_id: conference.id,
            requested_by_id: requester.id,
            requested_for_id: requestee.id,
            answer: ConsultationAnswer.Accepted,
            room_label: 'RoomLabel'
        });
        await service.respondToConsultationRequest(conference.id, requester.id, requestee.id, ConsultationAnswer.Accepted, 'RoomLabel');

        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(modalService.closeAll).toHaveBeenCalled();
        expect(apiClient.respondToConsultationRequest).toHaveBeenCalledWith(request);
    });

    it('should throw error to respond to consultation request and display error modal', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        apiClient.respondToConsultationRequest.and.throwError('Error');

        await service.respondToConsultationRequest(conference.id, requester.id, requestee.id, ConsultationAnswer.Accepted, 'RoomLabel');

        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(modalService.closeAll).toHaveBeenCalled();
        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should start the private consultation with endpoint and stop call ringing and clear modals', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const endpoint = conference.endpoints[0];
        const request = new PrivateVideoEndpointConsultationRequest({
            conference_id: conference.id,
            endpoint_id: endpoint.id
        });

        await service.startPrivateConsulationWithEndpoint(conference, endpoint);

        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
        expect(modalService.closeAll).toHaveBeenCalled();
        expect(apiClient.callVideoEndpoint).toHaveBeenCalledWith(request);
    });

    it('should display error modal when endpoint consultation has been requested throw unexpected error', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const endpoint = conference.endpoints[0];
        apiClient.callVideoEndpoint.and.callFake(() => throwError(error));

        await expectAsync(service.startPrivateConsulationWithEndpoint(conference, endpoint)).toBeRejectedWith(error);

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should start or join a consultation as room type JOH', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants.filter(x => x.role === Role.Judge)[0];

        const request = new StartPrivateConsultationRequest({
            conference_id: conference.id,
            requested_by: participant.id,
            room_type: VirtualCourtRoomType.JudgeJOH
        });

        await service.joinJudicialConsultationRoom(conference, participant);

        expect(apiClient.startOrJoinConsultation).toHaveBeenCalledWith(request);
    });

    it('should display error modal when unable to start or join a judidical consultation', async () => {
        const error = { error: 'test bad thing' };
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants.filter(x => x.role === Role.Judge)[0];
        apiClient.startOrJoinConsultation.and.callFake(() => throwError(error));

        await expectAsync(service.joinJudicialConsultationRoom(conference, participant)).toBeRejectedWith(error);

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should create participant consultation room', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants.filter(x => x.role === Role.Judge)[0];

        const request = new StartPrivateConsultationRequest({
            conference_id: conference.id,
            requested_by: participant.id,
            room_type: VirtualCourtRoomType.JudgeJOH
        });

        await service.createParticipantConsultationRoom(conference, participant, ['pat1', 'pat2']);

        expect(apiClient.startOrJoinConsultation).toHaveBeenCalledWith(request);
    });
    it('should displat error modal if create participant consultation room is not created', async () => {
        const error = { error: 'test bad thing' };

        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants.filter(x => x.role === Role.Judge)[0];
        apiClient.startOrJoinConsultation.and.callFake(() => throwError(error));

        const request = new StartPrivateConsultationRequest({
            conference_id: conference.id,
            requested_by: participant.id,
            room_type: VirtualCourtRoomType.JudgeJOH
        });

        await expectAsync(service.createParticipantConsultationRoom(conference, participant, ['pat1', 'pat2'])).toBeRejectedWith(error);

        expect(modalService.open).toHaveBeenCalledWith(ConsultationService.ERROR_PC_MODAL);
    });

    it('should leave a consultation', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];

        const request = new LeavePrivateConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id
        });

        await service.leaveConsultation(conference, participant);

        expect(apiClient.leaveConsultation).toHaveBeenCalledWith(request);
    });
});
