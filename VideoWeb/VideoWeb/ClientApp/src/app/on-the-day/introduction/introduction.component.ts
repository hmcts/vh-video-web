import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent extends ParticipantStatusBaseDirective implements OnInit, OnDestroy {
    conferenceId: string;
    conference: ConferenceLite;
    hearingVenueIsInScotland = false;
    hearingVenueFlagsServiceSubscription$: Subscription;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        private hearingVenueFlagsService: HearingVenueFlagsService
    ) {
        super(participantStatusUpdateService, logger);
    }

    ngOnInit() {
        this.getConference();

        this.hearingVenueFlagsServiceSubscription$ = this.hearingVenueFlagsService.hearingVenueIsScottish$.subscribe(
            value => (this.hearingVenueIsInScotland = value)
        );
    }

    ngOnDestroy() {
        this.hearingVenueFlagsServiceSubscription$.unsubscribe();
    }

    getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }
}
