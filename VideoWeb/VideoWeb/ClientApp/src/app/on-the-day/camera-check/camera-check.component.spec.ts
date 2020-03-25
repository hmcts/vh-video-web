import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite, ParticipantLite } from 'src/app/services/models/conference-lite';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { CameraCheckComponent } from './camera-check.component';

describe('CameraCheckComponent', () => {
    let component: CameraCheckComponent;
    let fixture: ComponentFixture<CameraCheckComponent>;
    let router: Router;

    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const pats = conference.participants.map(p => new ParticipantLite(p.id, p.username, p.display_name));
    const confLite = new ConferenceLite(conference.id, conference.case_number, pats);

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getActiveConference', 'raiseSelfTestFailureEvent']);
        videoWebServiceSpy.getActiveConference.and.returnValue(confLite);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            declarations: [CameraCheckComponent],
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
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CameraCheckComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
    });

    it('should default no selected values', () => {
        expect(component.form.pristine).toBeTruthy();
    });

    it('should invalidate form when "No" is selected', async () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('No');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.GetHelp]);
    });

    it('should validate form when "Yes" is selected', async () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('Yes');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.MicrophoneWorking, conference.id]);
    });

    it('should allow equipment check when answered "No"', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('No');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.invalid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
    });

    it('should allow equipment check when answered "Yes"', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('Yes');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
    });
});
