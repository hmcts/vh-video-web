import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { IntroductionComponent } from './introduction.component';
import { AdalService } from 'adal-angular4';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;
    let fixture: ComponentFixture<IntroductionComponent>;
    let debugElement: DebugElement;
    let router: Router;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
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
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useClass: MockVideoWebService },
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
        spyOn(router, 'navigate').and.callFake(() => {});
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
    });
});
