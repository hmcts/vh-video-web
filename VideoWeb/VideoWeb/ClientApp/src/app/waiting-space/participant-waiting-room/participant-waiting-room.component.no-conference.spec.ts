import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { throwError } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { AnalogueClockStubComponent } from 'src/app/testing/stubs/analogue-clock-stub';
import { IndividualConsultationControlsStubComponent } from 'src/app/testing/stubs/individual-consultation-controls-stub';
import {
  IndividualParticipantStatusListStubComponent,
  JudgeParticipantStatusListStubComponent
} from 'src/app/testing/stubs/participant-status-list-stub';

import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent when service returns an error', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;
  let errorService: ErrorService;

  configureTestSuite(() => {
    conference = new ConferenceTestData().getConferenceFuture();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>(
      'VideoWebService',
      ['getConferenceById']
    );
    videoWebServiceSpy.getConferenceById.and.returnValue(
      throwError({ status: 404, isApiException: true })
    );

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [
        ParticipantWaitingRoomComponent,
        IndividualParticipantStatusListStubComponent,
        AnalogueClockStubComponent,
        JudgeParticipantStatusListStubComponent,
        IndividualConsultationControlsStubComponent
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          }
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    router = TestBed.get(Router);
    route = TestBed.get(ActivatedRoute);
    errorService = TestBed.get(ErrorService);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
  });

  it('should handle api error with error service', async done => {
    spyOn(errorService, 'handleApiError').and.callFake(() => {
      Promise.resolve(true);
    });
    await component.getConference();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.hearing).toBeUndefined();
    expect(component.participant).toBeUndefined();
    expect(errorService.handleApiError).toHaveBeenCalled();
    done();
  });
});
