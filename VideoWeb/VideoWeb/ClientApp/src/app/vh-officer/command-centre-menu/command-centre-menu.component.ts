import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { MenuOption } from '../models/menus-options';
import { EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-command-centre-menu',
    templateUrl: './command-centre-menu.component.html',
    styleUrls: ['./command-centre-menu.component.scss']
})
export class CommandCentreMenuComponent implements OnInit, OnDestroy {
    @Output() selectedMenu = new EventEmitter<MenuOption>();
    subscriptions$ = new Subscription();
    currentMenu: MenuOption;
    constructor(private logger: Logger, private eventbus: EventBusService) {}

    ngOnInit() {
        this.currentMenu = MenuOption.Hearing;
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.subscriptions$.unsubscribe();
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

    setupSubscribers() {
        this.subscriptions$ = this.eventbus.on(VHEventType.ConferenceImClicked, () => {
            console.log('clicked im menu');
            this.displayMessages();
        });
    }

    private publishCurrentMenuOption(menuOption: MenuOption): void {
        this.currentMenu = menuOption;
        this.logger.debug(`[VHO Menu] - Selected menu ${this.currentMenu}`);
        this.selectedMenu.emit(this.currentMenu);
    }
}
