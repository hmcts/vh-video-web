import { ConsultationService } from 'src/app/services/api/consultation.service';
import { BehaviorSubject } from 'rxjs';

export function consultationServiceSpyFactory(): jasmine.SpyObj<ConsultationService> {
    const consultationServiceMock = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
        'resetWaitingForResponse',
        'clearOutgoingCallTimeout',
        'displayAdminConsultationRequest',
        'displayNoConsultationRoomAvailableModal',
        'displayIncomingPrivateConsultation',
        'raiseConsultationRequest',
        'handleConsultationResponse',
        'respondToConsultationRequest',
        'leaveConsultation',
        'respondToAdminConsultationRequest',
        'clearModals',
        'startPrivateConsulationWithEndpoint',
        'cancelTimedOutIncomingRequest'
    ]);

    consultationServiceMock.raiseConsultationRequest.and.returnValue(Promise.resolve());
    consultationServiceMock.respondToConsultationRequest.and.returnValue(Promise.resolve());
    consultationServiceMock.leaveConsultation.and.returnValue(Promise.resolve());
    consultationServiceMock.respondToAdminConsultationRequest.and.returnValue(Promise.resolve());
    consultationServiceMock.startPrivateConsulationWithEndpoint.and.returnValue(Promise.resolve());
    consultationServiceMock.consultationAcceptedBy = new BehaviorSubject<boolean>(true);

    return consultationServiceMock;
}
