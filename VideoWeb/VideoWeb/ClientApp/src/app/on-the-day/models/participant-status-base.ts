import { HostListener } from '@angular/core';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActivatedRoute } from '@angular/router';

export abstract class ParticipantStatusBase {
    constructor(
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        protected route: ActivatedRoute
    ) {}

    raiseNotSignedIn() {
        try {
            const eventConferenceId = this.route.snapshot.paramMap.get('conferenceId');

            this.participantStatusUpdateService
                .postParticipantStatus(EventType.ParticipantNotSignedIn, eventConferenceId)
                .then(() => {
                    this.logger.info('Participant status was updated to not signed in');
                })
                .catch(err => {
                    this.logger.error('Unable to update status to not signed in', err);
                });
        } catch (error) {
            this.logger.error('Failed to raise "UpdateParticipantStatusEventRequest"', error);
        }
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }
}
