import { ConsultationService } from 'src/app/services/api/consultation.service';

export function consultationServiceSpyFactory(): jasmine.SpyObj<ConsultationService> {
    const consultationServiceMock = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
        'respondToConsultationRequest',
        'startPrivateConsulationWithEndpoint',
        'joinJudicialConsultationRoom',
        'createParticipantConsultationRoom',
        'leaveConsultation',
        'clearModals',
        'displayModal',
        'displayConsultationErrorModal',
        'stopCallRinging',
        'initCallRingingSound'
    ]);

    consultationServiceMock.respondToConsultationRequest.and.returnValue(Promise.resolve());
    consultationServiceMock.leaveConsultation.and.returnValue(Promise.resolve());
    consultationServiceMock.startPrivateConsulationWithEndpoint.and.returnValue(Promise.resolve());
    consultationServiceMock.joinJudicialConsultationRoom.and.returnValue(Promise.resolve());
    consultationServiceMock.createParticipantConsultationRoom.and.returnValue(Promise.resolve());

    return consultationServiceMock;
}
