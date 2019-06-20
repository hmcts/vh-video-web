import { inject, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { SharedModule } from '../../shared/shared.module';
import { ApiClient, ConsultationAnswer, ConsultationRequest } from '../clients/api-client';
import { ConsultationService } from './consultation.service';


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
    spyOn(apiClient, 'handleConsultationRequest');
    const conference = new ConferenceTestData().getConferenceDetail();
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

  it('should have an answer when responding to a request for consulation', inject([ConsultationService], (service: ConsultationService) => {
    spyOn(apiClient, 'handleConsultationRequest');
    const conference = new ConferenceTestData().getConferenceDetail();
    const requester = conference.participants[0];
    const requestee = conference.participants[1];

    const request = new ConsultationRequest({
      conference_id: conference.id,
      requested_by: requester.id,
      requested_for: requestee.id,
      answer: ConsultationAnswer.Accepted
    });
    service.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Accepted);

    expect(apiClient.handleConsultationRequest).toHaveBeenCalledWith(request);
  }));
});
