import { ConsultationService } from 'src/app/services/api/consultation.service';

export function consultationServiceSpyFactory(): jasmine.SpyObj<ConsultationService> {
    const consultationServiceMock = jasmine.createSpyObj(ConsultationService, [
        'respondToConsultationRequest',
        'startPrivateConsulationWithEndpoint',
        'joinJudicialConsultationRoom',
        'createParticipantConsultationRoom',
        'leaveConsultation',
        'clearModals',
        'displayModal',
        'displayConsultationErrorModal',
        'stopCallRinging',
        'initCallRingingSound',
        'inviteToConsultation',
        'lockConsultation',
        'displayConsultationLeaveModal',
        'joinPrivateConsultationRoom',
        'addEndpointToConsultation',
        'consultationNameToString'
    ]);

    consultationServiceMock.respondToConsultationRequest.and.returnValue(Promise.resolve());
    consultationServiceMock.leaveConsultation.and.returnValue(Promise.resolve());
    consultationServiceMock.startPrivateConsulationWithEndpoint.and.returnValue(Promise.resolve());
    consultationServiceMock.joinJudicialConsultationRoom.and.returnValue(Promise.resolve());
    consultationServiceMock.createParticipantConsultationRoom.and.returnValue(Promise.resolve());
    consultationServiceMock.inviteToConsultation.and.returnValue(Promise.resolve());
    consultationServiceMock.lockConsultation.and.returnValue(Promise.resolve());
    consultationServiceMock.joinPrivateConsultationRoom.and.returnValue(Promise.resolve());
    consultationServiceMock.consultationNameToString.and.callFake(k => k);
    return consultationServiceMock;
}
