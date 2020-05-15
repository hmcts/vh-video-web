import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MenuOption } from '../models/menus-options';
import { CommandCentreMenuComponent } from './command-centre-menu.component';

describe('CommandCentreMenuComponent', () => {
    let component: CommandCentreMenuComponent;
    const logger: Logger = new MockLogger();

    beforeEach(() => {
        component = new CommandCentreMenuComponent(logger);
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
});
