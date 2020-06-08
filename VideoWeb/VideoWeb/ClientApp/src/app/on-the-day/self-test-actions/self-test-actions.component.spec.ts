import { SelfTestActionsComponent } from './self-test-actions.component';

describe('SelfTestActionsComponent', () => {
    let component: SelfTestActionsComponent;

    beforeEach(() => {
        component = new SelfTestActionsComponent();
    });

    it('should emit when equipment working button clicked', () => {
        spyOn(component.equipmentWorked, 'emit');
        component.equipmentWorksClicked();
        expect(component.equipmentWorked.emit).toHaveBeenCalled();
    });

    it('should emit when equipment broken button clicked', () => {
        spyOn(component.equipmentBroken, 'emit');
        component.equipmenBrokenClicked();
        expect(component.equipmentBroken.emit).toHaveBeenCalled();
    });
});
