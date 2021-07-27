import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { BackNavigationService } from 'src/app/shared/back-navigation/back-navigation.service';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss'],
})
export class IntroductionComponent extends ParticipantStatusBaseDirective implements OnInit {
    backLinkText: string;
    backLinkPath: string;
    conferenceId: string;
    conference: ConferenceLite;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        protected backNavigationService: BackNavigationService
    ) {
        super(participantStatusUpdateService, backNavigationService, logger);
    }

    ngOnInit() {
        super.ngOnInit();
        this.getConference();
    }

    getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }
}
