import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRulesComponent } from './hearing-rules.component';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { configureTestSuite } from 'ng-bullet';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

describe('HearingRulesComponent', () => {
    let component: HearingRulesComponent;
    let fixture: ComponentFixture<HearingRulesComponent>;
    let debugElement: DebugElement;
    let router: Router;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [HearingRulesComponent],
            imports: [RouterTestingModule, SharedModule],
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
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HearingRulesComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to declaration', () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        component.goToDeclaration();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Declaration, conference.id]);
    });
});
