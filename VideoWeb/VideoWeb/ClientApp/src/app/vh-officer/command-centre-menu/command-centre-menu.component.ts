import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { MenuOption } from '../models/menus-options';
import { EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { Subscription } from 'rxjs';
import { pageUrls } from '../../shared/page-url.constants';
import { Router } from '@angular/router';
import { Role, UserProfileResponse } from '../../services/clients/api-client';
import { VideoWebService } from '../../services/api/video-web.service';
import { ProfileService } from '../../services/api/profile.service';

@Component({
    selector: 'app-command-centre-menu',
    templateUrl: './command-centre-menu.component.html',
    styleUrls: ['./command-centre-menu.component.scss']
})
export class CommandCentreMenuComponent implements OnInit, OnDestroy {
    @Output() selectedMenu = new EventEmitter<MenuOption>();
    @Input() conferenceId: string | null;

    subscriptions$ = new Subscription();
    currentMenu: MenuOption;
    private loggedInUser: UserProfileResponse;

    constructor(
        private logger: Logger,
        private eventbus: EventBusService,
        private router: Router,
        private videoWebService: VideoWebService,
        private profileService: ProfileService
    ) {}

    get isStaffMember(): boolean {
        return this.loggedInUser?.roles?.includes(Role.StaffMember) ?? false;
    }

    ngOnInit() {
        this.profileService.getUserProfile().then(profile => (this.loggedInUser = profile));
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
            this.displayMessages();
        });
    }

    signIntoConference() {
        this.logger.debug('[VHO Menu] - Signing into judge waiting room', { conference: this.conferenceId });
        this.videoWebService.getConferenceById(this.conferenceId).then(conferenceResponse => {
            if (conferenceResponse.participants.some(x => x.user_name === this.loggedInUser.username)) {
                this.openWaitingRoomInTab(this.conferenceId);
            } else {
                this.videoWebService.staffMemberJoinConference(this.conferenceId).then(updatedConference => {
                    this.openWaitingRoomInTab(updatedConference.id);
                });
            }
        });
    }
    private openWaitingRoomInTab(conferenceId: string): void {
        window.open(this.router.serializeUrl(this.router.createUrlTree([pageUrls.StaffMemberWaitingRoom, conferenceId])), '_blank');
    }
    private publishCurrentMenuOption(menuOption: MenuOption): void {
        this.currentMenu = menuOption;
        this.logger.debug(`[VHO Menu] - Selected menu ${this.currentMenu}`);
        this.selectedMenu.emit(this.currentMenu);
    }
}
