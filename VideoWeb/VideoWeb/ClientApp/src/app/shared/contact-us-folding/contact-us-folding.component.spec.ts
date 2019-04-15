import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactUsFoldingComponent } from './contact-us-folding.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { SharedModule } from '../shared.module';
import { HttpClientModule } from '@angular/common/http';

describe('ContactUsFoldingComponent', () => {
  let component: ContactUsFoldingComponent;
  let fixture: ComponentFixture<ContactUsFoldingComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      declarations: [ContactUsFoldingComponent],
      providers: [
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
