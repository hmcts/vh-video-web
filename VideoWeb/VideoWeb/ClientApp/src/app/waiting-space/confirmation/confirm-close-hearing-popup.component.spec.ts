import { FormBuilder } from '@angular/forms';
import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UserMediaService } from 'src/app/services/user-media.service';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    beforeEach(() => {
        translateService.instant.calls.reset();
        const formBuilder = new FormBuilder();
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(['startAudioMuted']);
        component = new ConfirmStartHearingPopupComponent(translateService, formBuilder, userMediaServiceSpy);
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
});
