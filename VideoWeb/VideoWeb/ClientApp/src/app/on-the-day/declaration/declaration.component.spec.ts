import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { DeclarationComponent } from './declaration.component';
import { VideoWebService } from 'src/app/services/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';

describe('DeclarationComponent Tests', () => {
  let component: DeclarationComponent;
  let fixture: ComponentFixture<DeclarationComponent>;
  let checkboxControl: AbstractControl;
  let debugElement: DebugElement;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
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
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(DeclarationComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();

    checkboxControl = component.declarationForm.controls['declare'];
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
