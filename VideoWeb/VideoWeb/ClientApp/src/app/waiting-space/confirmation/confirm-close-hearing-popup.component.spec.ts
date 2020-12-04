import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    beforeEach(() => {
        component = new ConfirmStartHearingPopupComponent();
    });

    it('should return "start" by default', () => {
        expect(component.action).toBe('start');
    });

    it('should return "start" if hearing has not started', () => {
        component.hearingStarted = false;
        expect(component.action).toBe('start');
    });

    it('should return "resume" if hearing has already begun', () => {
        component.hearingStarted = true;
        expect(component.action).toBe('resume');
    });
});
