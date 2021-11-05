import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-hearing-rules',
    templateUrl: './hearing-rules.component.html',
    styleUrls: ['./hearing-rules.component.scss']
})
export class HearingRulesComponent extends ParticipantStatusBaseDirective implements OnInit {
    conferenceId: string;
    hearingVenueIsScottish$: Observable<boolean>;

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

        this.hearingVenueIsScottish$ = this.hearingVenueFlagsService.hearingVenueIsScottish$;
    }

    goToDeclaration() {
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
    }
}
