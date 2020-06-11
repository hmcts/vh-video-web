import { FormBuilder } from '@angular/forms';
import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VideoCheckComponent } from './video-check.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';

describe('VideoCheckComponent', () => {
    let component: VideoCheckComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);
    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    const formBuilder = new FormBuilder();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const mockAdalService = new MockAdalService();
    let adalService;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'raiseSelfTestFailureEvent'
        ]);
        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        adalService = mockAdalService;

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
    });

    beforeEach(() => {
        component = new VideoCheckComponent(
            router,
            activatedRoute,
            formBuilder,
            videoWebServiceSpy,
            adalService,
            errorService,
            logger,
            participantStatusUpdateService
        );
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should default no selected values', () => {
        expect(component.form.pristine).toBeTruthy();
    });

    it('should invalidate form when "No" is selected', async () => {
        component.equipmentCheck.setValue('No');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.GetHelp]);
    });

    it('should validate form when "Yes" is selected', async () => {
        component.equipmentCheck.setValue('Yes');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.HearingRules, conference.id]);
    });

    it('should allow equipment check when answered "No"', () => {
        component.equipmentCheck.setValue('No');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.invalid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });

    it('should not allow equipment check when answered "Yes"', () => {
        component.equipmentCheck.setValue('Yes');
        component.form.markAsDirty();
        component.checkEquipmentAgain();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledTimes(1);
    });
});
