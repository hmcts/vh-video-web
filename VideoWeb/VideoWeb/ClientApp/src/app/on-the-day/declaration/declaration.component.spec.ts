import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { DeclarationComponent } from './declaration.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

describe('DeclarationComponent Tests', () => {
  let component: DeclarationComponent;
  let fixture: ComponentFixture<DeclarationComponent>;
  let checkboxControl: AbstractControl;
  let debugElement: DebugElement;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [DeclarationComponent],
      imports: [RouterTestingModule, SharedModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        },
        { provide: VideoWebService, useClass: MockVideoWebService },
        { provide: Logger, useClass: MockLogger },
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeclarationComponent);
    debugElement = fixture.debugElement;
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    component.ngOnInit();
    checkboxControl = component.declarationForm.controls['declare'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form when declaration is not checked', () => {
    expect(checkboxControl.valid).toBeFalsy();
    checkboxControl.setValue(false);
    expect(component.declarationForm.valid).toBeFalsy();
  });

  it('should validate form when declaration is checked', () => {
    expect(checkboxControl.valid).toBeFalsy();
    checkboxControl.setValue(true);
    expect(component.declarationForm.valid).toBeTruthy();
  });

  it('should not go to waiting room when form is invalid', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    checkboxControl.setValue(false);
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledTimes(0);
  });

  it('should go to waiting room when form is valid', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    checkboxControl.setValue(true);
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantWaitingRoom, conference.id]);
  });
});
