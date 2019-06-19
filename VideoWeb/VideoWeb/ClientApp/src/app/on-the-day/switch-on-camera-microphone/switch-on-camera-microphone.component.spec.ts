import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { of } from 'rxjs';

describe('SwitchOnCameraMicrophoneComponent', () => {
  let component: SwitchOnCameraMicrophoneComponent;
  let fixture: ComponentFixture<SwitchOnCameraMicrophoneComponent>;
  let router: Router;
  let videoWebService: VideoWebService;
  let userMediaStreamService: UserMediaStreamService;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [SwitchOnCameraMicrophoneComponent, ContactUsFoldingStubComponent],
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
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchOnCameraMicrophoneComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    videoWebService = TestBed.get(VideoWebService);
    userMediaStreamService = TestBed.get(UserMediaStreamService);
    fixture.detectChanges();
  });

  it('should go to video test', async(() => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.goVideoTest();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.SelfTestVideo, component.conference.id]);
  }));

  it('should raise permission denied event on media access rejection', async(() => {
    spyOn(videoWebService, 'raiseMediaEvent').and.callFake(() => of());
    spyOn(userMediaStreamService, 'requestAccess').and.callFake(() => Promise.resolve(false));

    fixture.whenStable().then(() => {
      expect(component.mediaAccepted).toBeFalsy();
    }).then(() => {
      expect(videoWebService.raiseMediaEvent).toHaveBeenCalled();
    });

    component.requestMedia();
  }));

  it('should raise close stream when permission has been granted', async(async () => {
    spyOn(userMediaStreamService, 'requestAccess').and.callFake(() => Promise.resolve(true));
    spyOn(userMediaStreamService, 'stopRequestStream').and.callFake(() => { });

    await component.requestMedia();
    expect(component.mediaAccepted).toBeTruthy();
    fixture.whenStable().then(() => {
      expect(userMediaStreamService.stopRequestStream).toHaveBeenCalled();
    });
  }));
});
