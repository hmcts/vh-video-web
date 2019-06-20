import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraAndMicrophoneComponent } from './camera-and-microphone.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { configureTestSuite } from 'ng-bullet';

describe('CameraAndMicrophoneComponent', () => {
  let component: CameraAndMicrophoneComponent;
  let fixture: ComponentFixture<CameraAndMicrophoneComponent>;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [CameraAndMicrophoneComponent],
      imports: [RouterTestingModule, SharedModule],
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
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraAndMicrophoneComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to hearing rules', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.goToHearingRules();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.HearingRules, conference.id]);
  });
});
