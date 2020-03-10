import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { MicrophoneCheckComponent } from './microphone-check.component';

describe('MicrophoneCheckComponent', () => {
    let component: MicrophoneCheckComponent;
    let fixture: ComponentFixture<MicrophoneCheckComponent>;
    let router: Router;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
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
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MicrophoneCheckComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        fixture.detectChanges();
    });

    it('should default no selected values', () => {
        expect(component.form.pristine).toBeTruthy();
    });

    it('should invalidate form when "No" is selected', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('No');
        component.onSubmit();
        expect(component.form.valid).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.GetHelp]);
    });

    it('should validate form when "Yes" is selected', () => {
        spyOn(router, 'navigate').and.callFake(() => {});
        component.equipmentCheck.setValue('Yes');
        component.onSubmit();
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
});
