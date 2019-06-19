import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoCheckComponent } from './video-check.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { AbstractControl } from '@angular/forms';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { PageUrls } from 'src/app/shared/page-url.constants';

describe('VideoCheckComponent', () => {
  let component: VideoCheckComponent;
  let fixture: ComponentFixture<VideoCheckComponent>;
  let videoAnswer: AbstractControl;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ VideoCheckComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        },
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoCheckComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    fixture.detectChanges();
    videoAnswer = component.form.controls['videoCheck'];
  });

  it('should default no selected values', () => {
    expect(component.form.pristine).toBeTruthy();
    expect(component.videoCheck.pristine).toBeTruthy();
  });

  it('should invalidate form when "No" is selected', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    videoAnswer.setValue('No');
    component.onSubmit();
    expect(component.form.valid).toBeFalsy();
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });

  it('should validate form when "Yes" is selected', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    videoAnswer.setValue('Yes');
    component.onSubmit();
    expect(component.form.valid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.HearingRules, conference.id]);
  });

  it('should allow equipment check when answered "No"', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    videoAnswer.setValue('No');
    component.form.markAsDirty();
    component.checkEquipmentAgain();
    expect(component.form.invalid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
  });

  it('should not allow equipment check when answered "Yes"', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    videoAnswer.setValue('Yes');
    component.form.markAsDirty();
    component.checkEquipmentAgain();
    expect(component.form.valid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });
});
