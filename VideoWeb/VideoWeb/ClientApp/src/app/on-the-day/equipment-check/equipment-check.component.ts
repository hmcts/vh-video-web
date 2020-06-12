import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBase } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-equipment-check',
    templateUrl: './equipment-check.component.html'
})
export class EquipmentCheckComponent extends ParticipantStatusBase implements OnInit {
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

    goToCameraAndMicCheck() {
        if (this.conferenceId) {
            this.router.navigate([pageUrls.SwitchOnCameraMicrophone, this.conferenceId]);
        } else {
            this.router.navigate([pageUrls.SwitchOnCameraMicrophone]);
        }
    }
}
