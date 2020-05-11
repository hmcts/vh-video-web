import { AudioAlertComponent } from './audio-alert.component';

describe('AudioAlertComponent', () => {
    const component = new AudioAlertComponent();

    it('should emit event close on close alert', () => {
        spyOn(component.alertClose, 'emit');
        component.closeAlert();

        expect(component.alertClose.emit).toHaveBeenCalled();
    });
});
