import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { BackNavigationService } from 'src/app/shared/back-navigation/back-navigation.service';

@Component({
    selector: 'app-hearing-rules',
    templateUrl: './hearing-rules.component.html',
    styleUrls: ['./hearing-rules.component.scss'],
})
export class HearingRulesComponent extends ParticipantStatusBaseDirective implements OnInit {
    backLinkText: string;
    backLinkPath: string;
    conferenceId: string;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected backNavigationService: BackNavigationService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, backNavigationService, logger);
    }

    ngOnInit() {
        super.ngOnInit();
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    goToDeclaration() {
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
    }
}
