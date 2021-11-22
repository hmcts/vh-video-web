import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForHostResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { HostHearingListBaseComponentDirective } from '../host-hearing-list.component-base';

@Component({
    selector: 'app-staff-member-hearing-list',
    templateUrl: '../host-hearing-list.component.html',
    styleUrls: ['../host-hearing-list.component.scss']
})
export class StaffMemberHearingListComponent extends HostHearingListBaseComponentDirective implements OnInit {
    private _loggerPrefix = '[StaffMemberHearingList] -';

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
        this.logger.debug(`${this._loggerPrefix} Updating hearing list`);
        this.conferencesSubscription.add(
            this.videoWebService.getConferencesForStaffMember().subscribe({
                next: (data: ConferenceForHostResponse[]) => {
                    this.logger.debug(`${this._loggerPrefix} Got updated list`);
                    this.loadingData = false;
                    this.conferences = data;
                    if (this.conferences.length > 0) {
                        this.screenHelper.enableFullScreen(true);
                    }
                },
                error: error => {
                    this.logger.warn(`${this._loggerPrefix} There was a problem updating the hearing list`);
                    this.loadingData = false;
                    this.screenHelper.enableFullScreen(false);
                    this.errorService.handleApiError(error);
                }
            })
        );
    }
}
