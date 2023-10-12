import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent extends ParticipantStatusBaseDirective implements OnInit {
    conferenceId: string;
    conference: ConferenceLite;
    existingTest$: Observable<boolean>;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, logger);
    }

    ngOnInit() {
        this.getConference();
        this.existingTest$ = this.videoWebService.checkUserHasCompletedSelfTest();
    }

    getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    skipToCourtRulesPage() {
        this.logger.info('Skipping to court rules page', { conferenceId: this.conferenceId });
        this.router.navigate([pageUrls.HearingRules, this.conferenceId]);
    }
}
