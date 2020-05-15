import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { MenuOption } from '../models/menus-options';

@Component({
    selector: 'app-command-centre-menu',
    templateUrl: './command-centre-menu.component.html',
    styleUrls: ['./command-centre-menu.component.scss']
})
export class CommandCentreMenuComponent implements OnInit {
    @Output() selectedMenu = new EventEmitter<MenuOption>();

    currentMenu: MenuOption;
    constructor(private logger: Logger) {}

    ngOnInit() {
        this.currentMenu = MenuOption.Hearing;
    }

    displayHearing(): void {
        this.publishCurrentMenuOption(MenuOption.Hearing);
    }

    displayMessages(): void {
        this.publishCurrentMenuOption(MenuOption.Message);
    }

    displayAnnouncements(): void {
        this.publishCurrentMenuOption(MenuOption.Announcement);
    }

    private publishCurrentMenuOption(menuOption: MenuOption): void {
        this.currentMenu = menuOption;
        this.logger.debug(`[VHO Menu] - Selected menu ${this.currentMenu}`);
        this.selectedMenu.emit(this.currentMenu);
    }
}
