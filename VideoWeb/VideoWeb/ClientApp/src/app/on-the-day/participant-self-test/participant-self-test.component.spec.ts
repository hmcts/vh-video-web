import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantSelfTestComponent } from './participant-self-test.component';
import { SelfTestStubComponent } from 'src/app/testing/stubs/self-test-stub';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TestingModule } from 'src/app/testing/testing.module';
import { HttpClientModule } from '@angular/common/http';

describe('ParticipantSelfTestComponent', () => {
  let component: ParticipantSelfTestComponent;
  let fixture: ComponentFixture<ParticipantSelfTestComponent>;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientModule],
      declarations: [ParticipantSelfTestComponent, SelfTestStubComponent],
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
        { provide: Logger, useClass: MockLogger },
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantSelfTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
