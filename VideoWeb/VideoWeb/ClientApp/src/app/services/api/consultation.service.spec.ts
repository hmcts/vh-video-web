import { of, throwError } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
import {
    ApiClient,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    PrivateConsultationRequest,
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
        apiClient.startOrJoinConsultation.and.returnValue(of());
        apiClient.leaveConsultation.and.returnValue(of());

        timeout = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
        spyOn(global, 'setTimeout').and.returnValue(<any>timeout);

        service = new ConsultationService(apiClient, modalService, notificationSoundsService, logger, translateServiceSpy);

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

        expect(modalService.closeAll).toHaveBeenCalled();
        expect(apiClient.respondToConsultationRequest).toHaveBeenCalledWith(request);
    });

    it('should throw error to respond to consultation request and display error modal', async () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        apiClient.respondToConsultationRequest.and.throwError('Error');

        await service.respondToConsultationRequest(conference.id, requester.id, requestee.id, ConsultationAnswer.Accepted, 'RoomLabel');

        expect(modalService.closeAll).toHaveBeenCalled();
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

        await service.createParticipantConsultationRoom(conference, participant, ['pat1', 'pat2'], []);

        expect(apiClient.startOrJoinConsultation).toHaveBeenCalledWith(request);
    });
    it('should display error modal if create participant consultation room is not created', async () => {
        const error = { error: 'test bad thing' };

        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants.filter(x => x.role === Role.Judge)[0];
        apiClient.startOrJoinConsultation.and.callFake(() => throwError(error));

        await expectAsync(service.createParticipantConsultationRoom(conference, participant, ['pat1', 'pat2'], [])).toBeRejectedWith(error);

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

    it('should return correct room name for participant consultation - long', async () => {
        // Arrange
        const roomLabel = 'ParticipantConsultationRoom67';

        // Act
        const result = service.consultationNameToString(roomLabel, false);

        // Assert
        expect(result).toBe('consultation-service.meeting-room 67');
    });

    it('should return correct room name for participant consultation - short', async () => {
        // Arrange
        const roomLabel = 'ParticipantConsultationRoom67';

        // Act
        const result = service.consultationNameToString(roomLabel, true);

        // Assert
        expect(result).toBe('consultation-service.meeting-room-short 67');
    });

    it('should return correct room name for joh consultation - short', async () => {
        // Arrange
        const roomLabel = 'JudgeJOHConsultationRoom112';

        // Act
        const result = service.consultationNameToString(roomLabel, true);

        // Assert
        expect(result).toBe('consultation-service.judge-room-short 112');
    });

    it('should return correct room name for joh consultation - long', async () => {
        // Arrange
        const roomLabel = 'JudgeJOHConsultationRoom112';

        // Act
        const result = service.consultationNameToString(roomLabel, false);

        // Assert
        expect(result).toBe('consultation-service.judge-room 112');
    });

    it('should return correct room name for vho consultation - long', async () => {
        // Arrange
        const roomLabel = 'ConsultationRoom123';

        // Act
        const result = service.consultationNameToString(roomLabel, false);

        // Assert
        expect(result).toBe('consultation-service.meeting-room 123');
    });

    it('should return correct room name for vho consultation - short', async () => {
        // Arrange
        const roomLabel = 'ConsultationRoom123';

        // Act
        const result = service.consultationNameToString(roomLabel, true);

        // Assert
        expect(result).toBe('consultation-service.meeting-room-short 123');
    });

    it('should return meeting room if null - short', async () => {
        // Act
        const result = service.consultationNameToString(null, true);

        // Assert
        expect(result).toBe('consultation-service.meeting-room-short');
    });

    it('should return meeting room if null - long', async () => {
        // Act
        const result = service.consultationNameToString(null, false);

        // Assert
        expect(result).toBe('consultation-service.meeting-room');
    });
});
