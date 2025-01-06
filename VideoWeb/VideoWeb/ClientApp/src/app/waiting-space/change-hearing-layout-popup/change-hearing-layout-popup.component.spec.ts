import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { ChangeHearingLayoutPopupComponent } from './change-hearing-layout-popup.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

describe('ChangeHearingLayoutPopupComponent', () => {
    let component: ChangeHearingLayoutPopupComponent;
    const focusServiceSpy = jasmine.createSpyObj('FocusService', ['focus']);

    beforeEach(() => {
        component = new ChangeHearingLayoutPopupComponent(focusServiceSpy);
        const conference = new ConferenceTestData().getConferenceDetailNow();
        component.conference = mapConferenceToVHConference(conference);
    });

    it('should set modalDivId to change-hearing-layout-modal', () => {
        expect(component.modalDivId).toEqual('change-hearing-layout-modal');
    });

    it('should emit closeButtonPressed event when closePopup is called', () => {
        spyOn(component.popupAnswered, 'emit');
        component.closePopup();

        expect(component.popupAnswered.emit).toHaveBeenCalled();
    });
});
