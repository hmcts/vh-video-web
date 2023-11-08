import { FormBuilder } from '@angular/forms';
import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { ConferenceSetting } from 'src/app/shared/models/conference-setting';
import { UserMediaService } from 'src/app/services/user-media.service';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);

    beforeEach(() => {
        translateService.instant.calls.reset();
        const formBuilder = new FormBuilder();
        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [
            'getConferenceSetting',
            'updateStartWithAudioMuted'
        ]);
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
        const conference: ConferenceSetting = new ConferenceSetting('conferenceId', true);
        userMediaService.getConferenceSetting.and.returnValue(conference);
        component = new ConfirmStartHearingPopupComponent(translateService, formBuilder, userMediaService, launchDarklyServiceSpy);
        expect(component.form.value.muteMicrophone).toBeTrue();
    });

    it('should save mute microphone setting when clicking start or resume hearing', () => {
        component.form.setValue({ muteMicrophone: true });
        component.respondWithYes();
        expect(userMediaService.updateStartWithAudioMuted).toHaveBeenCalledWith(component.hearingId, true);
    });
});
