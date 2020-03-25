import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite, ParticipantLite } from 'src/app/services/models/conference-lite';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MicrophoneCheckComponent } from './microphone-check.component';

describe('MicrophoneCheckComponent', () => {
    let component: MicrophoneCheckComponent;
    let fixture: ComponentFixture<MicrophoneCheckComponent>;
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
            declarations: [MicrophoneCheckComponent],
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

    beforeEach(async () => {
        fixture = TestBed.createComponent(MicrophoneCheckComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
        await fixture.whenStable();
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
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.VideoWorking, conference.id]);
    });

    it('should allow equipment check when answered "No"', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('No');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.invalid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
    });

    it('should not allow equipment check when answered "Yes"', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('Yes');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
    });

    it('should show error when unanswered form is submitted', () => {
        component.form.markAsPristine();
        component.submitted = true;
        expect(component.showError).toBeTruthy();
    });

    it('should show error when an valid form is submitted', () => {
        component.form.markAsDirty();
        component.equipmentCheck.setValue('Yes');
        component.submitted = true;

        expect(component.showError).toBeTruthy();
    });

    it('should log error when self test event cannot be raised', async () => {
        videoWebServiceSpy.raiseSelfTestFailureEvent.and.callFake(() => Promise.reject({ status: 401, isApiException: false }));
        const logger = TestBed.get(Logger);
        spyOn(logger, 'error');

        component.form.markAsDirty();
        component.equipmentCheck.setValue('No');

        await component.onSubmit();

        expect(logger.error).toHaveBeenCalledTimes(1);
    });
});
