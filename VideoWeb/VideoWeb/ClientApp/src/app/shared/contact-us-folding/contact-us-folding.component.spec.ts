import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUsFoldingComponent } from './contact-us-folding.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { SharedModule } from '../shared.module';
import { HttpClientModule } from '@angular/common/http';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { of } from 'rxjs';

describe('ContactUsFoldingComponent', () => {
  let component: ContactUsFoldingComponent;
  let fixture: ComponentFixture<ContactUsFoldingComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

  beforeEach(async(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);

    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      declarations: [ContactUsFoldingComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        }
      ]
    })
      .compileComponents();
  }));

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
});
