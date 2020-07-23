import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MenuOption } from '../models/menus-options';
import { CommandCentreMenuComponent } from './command-centre-menu.component';
import { EventBusService, EmitEvent, VHEventType } from 'src/app/services/event-bus.service';

describe('CommandCentreMenuComponent', () => {
    let component: CommandCentreMenuComponent;
    const eventbus = new EventBusService();
    const logger: Logger = new MockLogger();

    beforeEach(() => {
        component = new CommandCentreMenuComponent(logger, eventbus);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should default to hearings menu option on init', () => {
        component.currentMenu = null;

        component.ngOnInit();

        expect(component.currentMenu).toBe(MenuOption.Hearing);
    });

    it('should emit hearing menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Hearing;

        component.displayHearing();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should emit message menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Message;

        component.displayMessages();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should emit announcement menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Announcement;

        component.displayAnnouncements();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should display im when im clicked event is received', () => {
        component.setupSubscribers();
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Message;

        eventbus.emit(new EmitEvent(VHEventType.ConferenceImClicked, null));

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });
});
