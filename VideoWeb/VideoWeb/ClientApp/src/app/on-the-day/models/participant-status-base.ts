import { HostListener, Directive } from '@angular/core';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { HasBackNavigationDirective } from 'src/app/shared/back-navigation/has-back-navigation.directive';
import { BackNavigationService } from 'src/app/shared/back-navigation/back-navigation.service';

@Directive()
export abstract class ParticipantStatusBaseDirective extends HasBackNavigationDirective {
    constructor(
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected backNavigationService: BackNavigationService,
        protected logger: Logger
    ) {
        super(backNavigationService);
    }

    abstract conferenceId: string;

    raiseNotSignedIn() {
        this.participantStatusUpdateService
            .postParticipantStatus(EventType.ParticipantNotSignedIn, this.conferenceId)
            .then(() => {
                this.logger.info('[ParticipantStatus] - Participant status was updated to not signed in');
            })
            .catch(err => {
                this.logger.error('[ParticipantStatus] - Unable to update status to not signed in', err, { conference: this.conferenceId });
            });
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }
}
