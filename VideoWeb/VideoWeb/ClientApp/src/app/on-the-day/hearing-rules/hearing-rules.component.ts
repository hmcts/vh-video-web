import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';

@Component({
    selector: 'app-hearing-rules',
    templateUrl: './hearing-rules.component.html',
    styleUrls: ['./hearing-rules.component.scss']
})
export class HearingRulesComponent extends ParticipantStatusBaseDirective implements OnInit, OnDestroy {
    conferenceId: string;
    hearingVenueIsInScotland = false;
    hearingVenueFlagsServiceSubscription$: Subscription;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        private hearingVenueFlagsService: HearingVenueFlagsService
    ) {
        super(participantStatusUpdateService, logger);
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');

        this.hearingVenueFlagsServiceSubscription$ = this.hearingVenueFlagsService.HearingVenueIsScottish.subscribe(
            value => (this.hearingVenueIsInScotland = value)
        );
    }

    ngOnDestroy() {
        this.hearingVenueFlagsServiceSubscription$.unsubscribe();
    }

    goToDeclaration() {
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
    }
}
