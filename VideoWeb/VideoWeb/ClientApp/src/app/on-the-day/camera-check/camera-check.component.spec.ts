import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { CameraCheckComponent } from './camera-check.component';
import { AdalService } from 'adal-angular4';

describe('CameraCheckComponent', () => {
  let component: CameraCheckComponent;
  let fixture: ComponentFixture<CameraCheckComponent>;
  let cameraAnswer: AbstractControl;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [CameraCheckComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        },
        { provide: AdalService, useClass: MockAdalService },
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraCheckComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    fixture.detectChanges();

    cameraAnswer = component.form.controls['cameraCheck'];
  });

  it('should default no selected values', () => {
    expect(component.form.pristine).toBeTruthy();
  });

  it('should invalidate form when "No" is selected', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    cameraAnswer.setValue('No');
    component.onSubmit();
    expect(component.form.valid).toBeFalsy();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.GetHelp]);
  });

  it('should validate form when "Yes" is selected', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    cameraAnswer.setValue('Yes');
    component.onSubmit();
    expect(component.form.valid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.MicrophoneWorking, conference.id]);
  });

  it('should allow equipment check when answered "No"', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    cameraAnswer.setValue('No');
    component.form.markAsDirty();
    component.checkEquipmentAgain();
    expect(component.form.invalid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
  });

  it('should allow equipment check when answered "Yes"', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    cameraAnswer.setValue('Yes');
    component.form.markAsDirty();
    component.checkEquipmentAgain();
    expect(component.form.valid).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
});
