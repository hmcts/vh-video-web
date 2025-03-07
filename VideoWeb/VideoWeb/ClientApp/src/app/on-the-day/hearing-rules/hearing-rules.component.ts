import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    standalone: false,
    selector: 'app-hearing-rules',
    templateUrl: './hearing-rules.component.html',
    styleUrls: ['./hearing-rules.component.scss']
})
export class HearingRulesComponent extends ParticipantStatusBaseDirective implements OnInit {
    conferenceId: string;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, logger);
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    goToDeclaration() {
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
    }
}
