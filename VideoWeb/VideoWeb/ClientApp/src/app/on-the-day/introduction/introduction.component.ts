import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventType, UpdateParticipantStatusEventRequest } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent implements OnInit {
    conferenceId: string;
    conference: ConferenceLite;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private logger: Logger
    ) {}

    async ngOnInit() {
        return this.getConference();
    }

    async getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
        await this.postParticipantJoiningStatus();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    async postParticipantJoiningStatus() {
        try {
            await this.videoWebService.raiseParticipantEvent(
                this.conference.id,
                new UpdateParticipantStatusEventRequest({
                    event_type: EventType.ParticipantJoining
                })
            );
        } catch (error) {
            this.logger.error('Failed to raise "UpdateParticipantStatusEventRequest"', error);
            this.errorService.handleApiError(error);
        }
    }
}
