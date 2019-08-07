import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUsFoldingComponent } from './contact-us-folding.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HttpClientModule } from '@angular/common/http';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { of } from 'rxjs';
import { configureTestSuite } from 'ng-bullet';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { RouterTestingModule } from '@angular/router/testing';

describe('ContactUsFoldingComponent', () => {
  let component: ContactUsFoldingComponent;
  let fixture: ComponentFixture<ContactUsFoldingComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

  configureTestSuite(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);

    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [ContactUsFoldingComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: Logger, useClass: MockLogger },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          }
        }
      ]

    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactUsFoldingComponent);
    component = fixture.componentInstance;
  });

  it('should return blank case number', () => {
    videoWebServiceSpy.getConferenceById.and.returnValue(of(null));
    component.ngOnInit();
    expect(component.caseNumber).toBe('');
  });

  it('should return case number', () => {
    videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));
    component.ngOnInit();
    expect(component.caseNumber).toBe(conference.case_number);
  });

  it('should toggle when pressed', () => {
    component.expanded = false;
    component.toggle();
    expect(component.expanded).toBe(true);
    component.toggle();
    expect(component.expanded).toBe(false);
  });
});
