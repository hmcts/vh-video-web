import { HostListener } from '@angular/core';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';

export abstract class ParticipantStatusBase {
    constructor(protected participantStatusUpdateService: ParticipantStatusUpdateService, protected logger: Logger) {}

    abstract conferenceId: string;

    raiseNotSignedIn() {
        this.participantStatusUpdateService
            .postParticipantStatus(EventType.ParticipantNotSignedIn, this.conferenceId)
            .then(() => {
                this.logger.info('Participant status was updated to not signed in');
            })
            .catch(err => {
                this.logger.error('Unable to update status to not signed in', err);
            });
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }
}
