import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { IntroductionComponent } from './introduction.component';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;
    let fixture: ComponentFixture<IntroductionComponent>;
    let debugElement: DebugElement;
    let router: Router;

    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'raiseParticipantEvent'
        ]);
        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);

        TestBed.configureTestingModule({
            declarations: [IntroductionComponent],
            imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });

        fixture = TestBed.createComponent(IntroductionComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        router = TestBed.get(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(IntroductionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should navigate to equipment check', () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });
});
