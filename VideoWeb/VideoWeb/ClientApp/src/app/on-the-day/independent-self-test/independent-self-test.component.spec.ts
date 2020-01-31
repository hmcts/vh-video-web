import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { SelfTestStubComponent } from 'src/app/testing/stubs/self-test-stub';
import { IndependentSelfTestComponent } from './independent-self-test.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';
import { configureTestSuite } from 'ng-bullet';
import { BaseSelfTestComponent } from '../models/base-self-test.component';
import { ConferenceResponse } from 'src/app/services/clients/api-client';

describe('IndependentSelfTestComponent', () => {
  let component: IndependentSelfTestComponent;
  let fixture: ComponentFixture<IndependentSelfTestComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();
  let router: Router;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientModule],
      declarations: [IndependentSelfTestComponent, SelfTestStubComponent, ContactUsFoldingStubComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        },
        { provide: Logger, useClass: MockLogger },
        { provide: AdalService, useClass: MockAdalService },
        { provide: Logger, useClass: MockLogger },
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndependentSelfTestComponent);
    component = fixture.componentInstance;
    component.selfTestComponent = TestBed.createComponent(SelfTestStubComponent).componentInstance as SelfTestComponent;
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('should navigate to hearing list when equipment works', () => {
    spyOn(router, 'navigateByUrl').and.callFake(() => { });
    component.equipmentWorksHandler();
    expect(router.navigateByUrl).toHaveBeenCalledWith(PageUrls.ParticipantHearingList);
  });

  it('should show equipment fault message when equipment fails', () => {
    component.equipmentFaultyHandler();
    expect(component.showEquipmentFaultMessage).toBeTruthy();
    expect(component.testInProgress).toBeFalsy();
    expect(component.hideSelfTest).toBeTruthy();
  });

  it('should show self test restarting video', () => {
    const selfTestSpy = jasmine.createSpyObj<SelfTestComponent>('SelfTestComponent', ['replayVideo']);
    selfTestSpy.replayVideo.and.callFake(() => { });
    component.selfTestComponent = selfTestSpy;

    component.restartTest();

    expect(component.showEquipmentFaultMessage).toBeFalsy();
    expect(component.testInProgress).toBeFalsy();
    expect(component.hideSelfTest).toBeFalsy();
    expect(selfTestSpy.replayVideo).toHaveBeenCalled();
  });
});
