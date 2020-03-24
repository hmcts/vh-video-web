import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForUserResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-judge-hearing-list',
    templateUrl: './judge-hearing-list.component.html',
    styleUrls: ['./judge-hearing-list.component.scss']
})
export class JudgeHearingListComponent implements OnInit, OnDestroy {
    contact = {
        phone: VhContactDetails.phone
    };

    conferences: ConferenceForUserResponse[];
    conferencesSubscription: Subscription;
    hearingListForm: FormGroup;
    loadingData: boolean;
    interval: any;
    today = new Date();
    profile: UserProfileResponse;

    eventHubSubscriptions: Subscription = new Subscription();

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private profileService: ProfileService,
        private logger: Logger,
        private eventsService: EventsService
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.profileService.getUserProfile().then(profile => {
            this.profile = profile;
        });
        this.retrieveHearingsForUser();
        this.setupSubscribers();
        this.interval = setInterval(() => {
            this.retrieveHearingsForUser();
        }, 30000);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('Clearing intervals and subscriptions for Judge/Clerk');
        clearInterval(this.interval);
        this.conferencesSubscription.unsubscribe();
        this.enableFullScreen(false);
        this.eventHubSubscriptions.unsubscribe();
    }

    retrieveHearingsForUser() {
        this.conferencesSubscription = this.videoWebService.getConferencesForJudge().subscribe(
            (data: ConferenceForUserResponse[]) => {
                this.loadingData = false;
                this.conferences = data;
                if (this.conferences.length > 0) {
                    this.enableFullScreen(true);
                }
            },
            error => {
                this.loadingData = false;
                this.enableFullScreen(false);
                this.errorService.handleApiError(error);
            }
        );
    }

    get courtName(): string {
        return this.profile ? `${this.profile.first_name}, ${this.profile.last_name}` : '';
    }

    hasHearings() {
        return this.conferences !== undefined && this.conferences.length > 0;
    }

    onConferenceSelected(conference: ConferenceForUserResponse) {
        this.logger.event('signing into judge waiting room', { conference: conference.id });
        this.router.navigate([PageUrls.JudgeWaitingRoom, conference.id]);
    }

    goToEquipmentCheck() {
        this.router.navigate([PageUrls.EquipmentCheck]);
    }

    enableFullScreen(fullScreen: boolean) {
        // tslint:disable-next-line:quotemark
        const masterContainerCount = $("div[id*='master-container']").length;
        if (masterContainerCount > 1) {
            throw new Error('Multiple master containers in DOM');
        }

        const masterContainer = document.getElementById('master-container');
        if (!masterContainer) {
            return;
        }

        if (fullScreen) {
            masterContainer.classList.add('fullscreen');
        } else {
            masterContainer.classList.remove('fullscreen');
        }
    }

    setupSubscribers() {
        this.eventHubSubscriptions.add(
            this.eventsService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
            })
        );
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        const conference = this.conferences.find(c => c.id === message.conferenceId);
        conference.status = message.status;
    }
}
