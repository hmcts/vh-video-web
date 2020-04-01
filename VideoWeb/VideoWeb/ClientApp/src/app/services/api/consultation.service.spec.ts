import { inject, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { SharedModule } from '../../shared/shared.module';
import {
    ApiClient,
    ConsultationAnswer,
    ConsultationRequest,
    LeaveConsultationRequest,
    AdminConsultationRequest,
    RoomType
} from '../clients/api-client';
import { ConsultationService } from './consultation.service';
import { of } from 'rxjs';

describe('ConsultationService', () => {
    let apiClient: ApiClient;
    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            providers: [ConsultationService]
        });
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            providers: [ConsultationService]
        });
        apiClient = TestBed.get(ApiClient);
    });

    it('should not have an answer when raising a request for consulation', inject([ConsultationService], (service: ConsultationService) => {
        spyOn(apiClient, 'handleConsultationRequest').and.returnValue(of());
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const requester = conference.participants[0];
        const requestee = conference.participants[1];

        const request = new ConsultationRequest({
            conference_id: conference.id,
            requested_by: requester.id,
            requested_for: requestee.id
        });
        service.raiseConsultationRequest(conference, requester, requestee);

        expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
    }));

    it('should have an answer when responding to a request for consulation', inject(
        [ConsultationService],
        async (service: ConsultationService) => {
            spyOn(apiClient, 'handleConsultationRequest').and.returnValue(of());
            const conference = new ConferenceTestData().getConferenceDetailFuture();
            const requester = conference.participants[0];
            const requestee = conference.participants[1];

            const request = new ConsultationRequest({
                conference_id: conference.id,
                requested_by: requester.id,
                requested_for: requestee.id,
                answer: ConsultationAnswer.Accepted
            });
            await service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);

            expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
        }
    ));

    it('should leave a consultation', inject([ConsultationService], async (service: ConsultationService) => {
        spyOn(apiClient, 'leavePrivateConsultation').and.returnValue(of());
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];

        const request = new LeaveConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id
        });

        await service.leaveConsultation(conference, participant);

        expect(apiClient.leavePrivateConsultation).toHaveBeenCalledWith(request);
    }));

    it('should respond to an admin consultation', inject([ConsultationService], async (service: ConsultationService) => {
        spyOn(apiClient, 'respondToAdminConsultationRequest').and.returnValue(of());
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = conference.participants[0];
        const answer = ConsultationAnswer.Accepted;
        const room = RoomType.WaitingRoom;
        const request = new AdminConsultationRequest({
            conference_id: conference.id,
            participant_id: participant.id,
            answer,
            consultation_room: room
        });

        await service.respondToAdminConsultationRequest(conference, participant, answer, room);

        expect(apiClient.respondToAdminConsultationRequest).toHaveBeenCalledWith(request);
    }));
});
