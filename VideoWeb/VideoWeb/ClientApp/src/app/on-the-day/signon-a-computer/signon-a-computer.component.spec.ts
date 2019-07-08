import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignonAComputerComponent } from './signon-a-computer.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

describe('SignonAComputerComponent', () => {
  let component: SignonAComputerComponent;
  let fixture: ComponentFixture<SignonAComputerComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SignonAComputerComponent],
      imports: [SharedModule],
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
    fixture = TestBed.createComponent(SignonAComputerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
