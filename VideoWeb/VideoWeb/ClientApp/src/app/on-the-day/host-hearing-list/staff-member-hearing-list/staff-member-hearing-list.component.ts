import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForHostResponse, StaffMemberJoinConferenceRequest } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
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

    onConferenceSelected(conference: ConferenceForHostResponse) {
        this.logger.debug('[StaffMemberHearingList] - Signing into judge waiting room', { conference: conference.id });

        this.videoWebService.getConferenceById(conference.id).then(conferenceResponse => {
            this.hearingVenueFlagsService.setHearingVenueIsScottish(conference.hearing_venue_is_scottish);
            this.profileService.getUserProfile().then(profile => {
                if (conferenceResponse.participants.some(x => x.user_name == profile.username)) {
                    this.router.navigate([pageUrls.StaffMemberWaitingRoom, conference.id]);
                }
                this.videoWebService
                    .staffMemberJoinConference(conference.id, new StaffMemberJoinConferenceRequest({ username: profile.username }))
                    .then(updatedConference => {
                        this.router.navigate([pageUrls.StaffMemberWaitingRoom, updatedConference.id]);
                    });
            });
        });
    }
}
