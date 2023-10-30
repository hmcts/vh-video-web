import { FormBuilder } from '@angular/forms';
import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { LocalStorageService } from 'src/app/services/conference/local-storage.service';
import { MockUserMediaService } from 'src/app/testing/mocks/mock-user-media.service';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    let userMediaService: MockUserMediaService;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const errorServiceSpy = jasmine.createSpyObj<ErrorService>(['handleApiError']);
    const loggerSpy = jasmine.createSpyObj<Logger>(['error']);
    const localStorageServiceSpy = jasmine.createSpyObj<LocalStorageService>(['save', 'load']);

    beforeEach(() => {
        translateService.instant.calls.reset();
        const formBuilder = new FormBuilder();
        userMediaService = new MockUserMediaService(errorServiceSpy, loggerSpy, localStorageServiceSpy);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        component = new ConfirmStartHearingPopupComponent(translateService, formBuilder, userMediaService, launchDarklyServiceSpy);
    });

    it('should return "start" by default', () => {
        const expectedText = 'confirm-start-hearing-popup.start';
        expect(component.action).toBe(expectedText);
    });

    it('should return "start" if hearing has not started', () => {
        component.hearingStarted = false;
        const expectedText = 'confirm-start-hearing-popup.start';
        expect(component.action).toBe(expectedText);
    });

    it('should return "resume" if hearing has already begun', () => {
        component.hearingStarted = true;
        const expectedText = 'confirm-start-hearing-popup.resume';
        expect(component.action).toBe(expectedText);
    });

    it('should prepopulate form when startWithAudioMuted is true in local storage', () => {
        const formBuilder = new FormBuilder();
        spyOnProperty(userMediaService, 'startWithAudioMuted').and.returnValue(true);
        component = new ConfirmStartHearingPopupComponent(translateService, formBuilder, userMediaService, launchDarklyServiceSpy);
        expect(component.form.value.muteMicrophone).toBeTrue();
    });

    it('should save mute microphone setting when clicking start or resume hearing', () => {
        component.form.setValue({ muteMicrophone: true });
        component.respondWithYes();
        expect(userMediaService.startWithAudioMuted).toBeTrue();
    });
});
