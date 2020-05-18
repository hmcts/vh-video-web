import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CameraAndMicrophoneComponent } from './camera-and-microphone.component';

describe('CameraAndMicrophoneComponent', () => {
    let component: CameraAndMicrophoneComponent;
    let fixture: ComponentFixture<CameraAndMicrophoneComponent>;
    let router: Router;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [CameraAndMicrophoneComponent],
            imports: [RouterTestingModule, SharedModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CameraAndMicrophoneComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to hearing rules', () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        component.goToHearingRules();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.HearingRules, conference.id]);
    });
});
