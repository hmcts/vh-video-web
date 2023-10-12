import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, merge, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role } from 'src/app/services/clients/api-client';
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
    isRepresentative: boolean;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private profileService: ProfileService,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, logger);
    }

    ngOnInit() {
        this.getConference();
        // check if the user is a representative
        this.profileService
            .getUserProfile()
            .then(profile => {
                this.isRepresentative = profile.roles.includes(Role.Representative);
                this.existingTest$ = this.videoWebService.checkUserHasCompletedSelfTest();
            })
            .catch(err => {
                this.logger.error('[Introduction] - Failed to get user profile on introduction page', err);
            });
    }

    getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    skipToCourtRulesPage() {
        this.logger.info('Introduction] - Skipping to court rules page', { conferenceId: this.conferenceId });
        this.router.navigate([pageUrls.HearingRules, this.conferenceId]);
    }
}
