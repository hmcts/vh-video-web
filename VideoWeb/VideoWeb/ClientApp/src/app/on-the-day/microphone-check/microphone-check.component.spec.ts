import { UntypedFormBuilder } from '@angular/forms';
import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { MicrophoneCheckComponent } from './microphone-check.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('MicrophoneCheckComponent', () => {
    let component: MicrophoneCheckComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const conferenceLite = new ConferenceLite(conference.id, conference.case_number);
    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    const formBuilder = new UntypedFormBuilder();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    const translateService = translateServiceSpy;

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'raiseSelfTestFailureEvent'
        ]);

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(conferenceLite);
    });

    beforeEach(() => {
        translateService.instant.calls.reset();

        component = new MicrophoneCheckComponent(
            router,
            activatedRoute,
            formBuilder,
            videoWebServiceSpy,
            errorService,
            logger,
            participantStatusUpdateService,
            translateService
        );
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should default no selected values', () => {
        expect(component.form.pristine).toBeTruthy();
    });

    it('should invalidate form when "No" is selected', async () => {
        const payload = new AddSelfTestFailureEventRequest({
            self_test_failure_reason: SelfTestFailureReason.Microphone
        });
        component.equipmentCheck.setValue('No');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeFalsy();
        expect(videoWebServiceSpy.raiseSelfTestFailureEvent.calls.mostRecent().args[0]).toBe(conference.id);
        expect(videoWebServiceSpy.raiseSelfTestFailureEvent.calls.mostRecent().args[1]).toEqual(payload);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.GetHelp]);
    });

    it('should validate form when "Yes" is selected', async () => {
        component.equipmentCheck.setValue('Yes');
        component.equipmentCheck.markAsDirty();
        await component.onSubmit();
        expect(component.form.valid).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.VideoWorking, conference.id]);
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
        const error = new Error('unit test error');
        videoWebServiceSpy.raiseSelfTestFailureEvent.and.callFake(() => Promise.reject(error));
        const logSpy = spyOn(logger, 'error');
        component.form.markAsDirty();
        component.equipmentCheck.setValue('No');

        await component.onSubmit();

        expect(logSpy.calls.mostRecent().args[0]).toMatch('Failed to raise "SelfTestFailureEvent"');
        expect(logSpy.calls.mostRecent().args[1]).toBe(error);
    });

    it('should return "Microphone" for equipment check', () => {
        expect(component.getEquipmentCheck()).toBe('microphone-check.microphone');
    });

    it('should return "Microphone" for self test reason', () => {
        expect(component.getFailureReason()).toBe(SelfTestFailureReason.Microphone);
    });
});
