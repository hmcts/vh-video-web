import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
    const component = new PrivacyPolicyComponent();
    it('should call browser print function', () => {
        spyOn(window, 'print');
        component.printPage();
        expect(window.print).toHaveBeenCalled();
    });
});
