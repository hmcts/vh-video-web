import { Directive, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForHostResponse,
    LoggedParticipantResponse,
    Role,
    StaffMemberJoinConferenceRequest,
    UserProfileResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

@Directive()
export abstract class HostHearingListBaseComponentDirective implements OnInit, OnDestroy {
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
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected profileService: ProfileService,
        protected logger: Logger,
        protected eventsService: EventsService,
        protected screenHelper: ScreenHelper,
        protected hearingVenueFlagsService: HearingVenueFlagsService
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.profileService.getUserProfile().then(profile => {
            this.profile = profile;
        });
        this.retrieveHearingsForUser();
        this.setupSubscribers();
        this.hearingVenueFlagsService.setHearingVenueIsScottish(false);
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

    abstract retrieveHearingsForUser();

    get courtName(): string {
        return this.profile ? `${this.profile.first_name}, ${this.profile.last_name}` : '';
    }

    hasHearings() {
        return !!this.conferences && this.conferences.length > 0;
    }

    onConferenceSelected(conference: ConferenceForHostResponse) {
        this.logger.debug('[JudgeHearingList] - Signing into judge waiting room', { conference: conference.id });
        this.hearingVenueFlagsService.setHearingVenueIsScottish(conference.hearing_venue_is_scottish);
        this.profileService.getUserProfile().then(profile => {
            if (profile.role === Role.StaffMember) {
                this.videoWebService
                    .staffMemberJoinConference(conference.id, new StaffMemberJoinConferenceRequest({ username: profile.username }))
                    .then(
                        updatedConference => {
                            this.router.navigate([pageUrls.StaffMemberWaitingRoom, updatedConference.id]);
                        },
                    );
            } else {
                this.videoWebService.getCurrentParticipant(conference.id).then(x => {
                    const useJudgeWaitingRoom = conference.participants.find(
                        p => p.id === x.participant_id && p.hearing_role === HearingRole.JUDGE
                    );
                    if (useJudgeWaitingRoom) {
                        this.router.navigate([pageUrls.JudgeWaitingRoom, conference.id]);
                    } else {
                        this.router.navigate([pageUrls.JOHWaitingRoom, conference.id]);
                    }
                });
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
