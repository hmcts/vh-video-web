import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { SelfTestStubComponent } from 'src/app/testing/stubs/self-test-stub';
import { ParticipantSelfTestComponent } from './participant-self-test.component';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { configureTestSuite } from 'ng-bullet';

describe('ParticipantSelfTestComponent', () => {
    let component: ParticipantSelfTestComponent;
    let fixture: ComponentFixture<ParticipantSelfTestComponent>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    let router: Router;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule],
            declarations: [ParticipantSelfTestComponent, SelfTestStubComponent, ContactUsFoldingStubComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: AdalService, useClass: MockAdalService },
                { provide: Logger, useClass: MockLogger },
                { provide: VideoWebService, useClass: MockVideoWebService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantSelfTestComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
    });

    it('should navigate to camera working screen', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.continueParticipantJourney();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
    });
});
