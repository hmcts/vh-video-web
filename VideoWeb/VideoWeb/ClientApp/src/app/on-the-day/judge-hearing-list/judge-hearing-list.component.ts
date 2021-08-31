import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForHostResponse, LoggedParticipantResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';

@Component({
    selector: 'app-judge-hearing-list',
    templateUrl: './judge-hearing-list.component.html',
    styleUrls: ['./judge-hearing-list.component.scss']
})
export class JudgeHearingListComponent implements OnInit, OnDestroy {
    contact = {
        phone: vhContactDetails.phone
    };

    conferences: ConferenceForHostResponse[];
    conferencesSubscription = new Subscription();
    hearingListForm: FormGroup;
    loadingData: boolean;
    interval: any;
    today = new Date();
    profile: UserProfileResponse;
    loggedUser: LoggedParticipantResponse;
    eventHubSubscriptions: Subscription = new Subscription();

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private profileService: ProfileService,
        private logger: Logger,
        private eventsService: EventsService,
        private screenHelper: ScreenHelper
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
        this.logger.debug('[JudgeHearingList] - Clearing intervals and subscriptions for Judge/Clerk');
        clearInterval(this.interval);
        this.conferencesSubscription.unsubscribe();
        this.screenHelper.enableFullScreen(false);
        this.eventHubSubscriptions.unsubscribe();
    }

    retrieveHearingsForUser() {
        this.logger.debug('[JudgeHearingList] - Updating hearing list');
        this.conferencesSubscription.add(
            this.videoWebService.getConferencesForJudge().subscribe({
                next: (data: ConferenceForHostResponse[]) => {
                    this.logger.debug('[JudgeHearingList] - Got updated list');
                    this.loadingData = false;
                    this.conferences = data;
                    if (this.conferences.length > 0) {
                        this.screenHelper.enableFullScreen(true);
                    }
                },
                error: error => {
                    this.logger.warn('[JudgeHearingList] - There was a problem updating the hearing list');
                    this.loadingData = false;
                    this.screenHelper.enableFullScreen(false);
                    this.errorService.handleApiError(error);
                }
            })
        );
    }

    get courtName(): string {
        return this.profile ? `${this.profile.first_name}, ${this.profile.last_name}` : '';
    }

    hasHearings() {
        return !!this.conferences && this.conferences.length > 0;
    }

    onConferenceSelected(conference: ConferenceForHostResponse) {
        this.logger.debug('[JudgeHearingList] - Signing into judge waiting room', { conference: conference.id });
        this.videoWebService.getCurrentParticipant(conference.id).then(x => {
            const result = conference.participants.find(
                p => p.id === x.participant_id && (p.hearing_role === 'Judge' || p.hearing_role === 'StaffMember')
            );
            if (result) {
                this.router.navigate([pageUrls.JudgeWaitingRoom, conference.id]);
            } else {
                this.router.navigate([pageUrls.JOHWaitingRoom, conference.id]);
            }
        });
    }

    goToEquipmentCheck() {
        this.logger.debug('[JudgeHearingList] - Going to equipment check from hearing list.');
        this.router.navigate([pageUrls.EquipmentCheck]);
    }

    setupSubscribers() {
        this.eventHubSubscriptions.add(
            this.eventsService.getHearingStatusMessage().subscribe({
                next: message => {
                    this.handleConferenceStatusChange(message);
                }
            })
        );
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        this.logger.debug('[JudgeHearingList] - Handling conference status message', message);
        const conference = this.conferences.find(c => c.id === message.conferenceId);
        conference.status = message.status;
    }
}
