import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { BackNavigationStubComponent } from 'src/app/testing/stubs/back-navigation-stub';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';

describe('SwitchOnCameraMicrophoneComponent', () => {
    let component: SwitchOnCameraMicrophoneComponent;
    let fixture: ComponentFixture<SwitchOnCameraMicrophoneComponent>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let router: Router;
    let videoWebService: VideoWebService;
    let userMediaStreamService: UserMediaStreamService;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const judgerProfile = new UserProfileResponse({ role: Role.Judge });
    const individualProfile = new UserProfileResponse({ role: Role.Individual });

    configureTestSuite(() => {
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(judgerProfile));
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [SwitchOnCameraMicrophoneComponent, ContactUsFoldingStubComponent, BackNavigationStubComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: Logger, useClass: MockLogger },
                { provide: ProfileService, useValue: profileServiceSpy }
            ]
        });
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(SwitchOnCameraMicrophoneComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        videoWebService = TestBed.get(VideoWebService);
        userMediaStreamService = TestBed.get(UserMediaStreamService);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should go to judge self test when profile is judge', async () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        component.isJudge = true;
        component.goVideoTest();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeSelfTestVideo, component.conference.id]);
    });

    it('should go to participant self test when profile is not a judge', async () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(individualProfile));
        component.isJudge = false;
        component.goVideoTest();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantSelfTestVideo, component.conference.id]);
    });

    it('should raise permission denied event on media access rejection', async () => {
        spyOn(videoWebService, 'raiseMediaEvent').and.callFake(() => Promise.resolve());
        spyOn(userMediaStreamService, 'requestAccess').and.callFake(() => Promise.resolve(false));

        await component.requestMedia();
        expect(component.mediaAccepted).toBeFalsy();
        expect(videoWebService.raiseMediaEvent).toHaveBeenCalled();
    });
});
