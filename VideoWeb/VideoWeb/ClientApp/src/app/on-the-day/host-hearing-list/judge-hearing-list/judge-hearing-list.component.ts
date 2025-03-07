import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HostHearingListBaseComponentDirective } from 'src/app/on-the-day/host-hearing-list/host-hearing-list.component-base';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForHostResponse, LoggedParticipantResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ScreenHelper } from 'src/app/shared/screen-helper';

@Component({
    standalone: false,
    selector: 'app-judge-hearing-list',
    templateUrl: '../host-hearing-list.component.html',
    styleUrls: ['../host-hearing-list.component.scss']
})
export class JudgeHearingListComponent extends HostHearingListBaseComponentDirective implements OnInit, OnDestroy {
    conferences: ConferenceForHostResponse[];
    conferencesSubscription = new Subscription();
    hearingListForm: UntypedFormGroup;
    loadingData: boolean;
    interval: any;
    today = new Date();
    profile: UserProfileResponse;
    loggedUser: LoggedParticipantResponse;
    eventHubSubscriptions: Subscription = new Subscription();

    constructor(
        private errorService: ErrorService,
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected profileService: ProfileService,
        protected logger: Logger,
        protected eventsService: EventsService,
        protected screenHelper: ScreenHelper,
        protected hearingVenueFlagsService: HearingVenueFlagsService
    ) {
        super(videoWebService, router, profileService, logger, eventsService, screenHelper, hearingVenueFlagsService);
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
}
