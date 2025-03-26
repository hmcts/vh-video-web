import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SelfTestFailureReason, EventType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { SelfTestActions } from 'src/app/waiting-space/store/actions/self-test.actions';

@Component({
    standalone: false,
    selector: 'app-participant-self-test',
    templateUrl: './participant-self-test.component.html'
})
export class ParticipantSelfTestComponent extends BaseSelfTestComponentDirective {
    continueClicked: boolean;
    constructor(
        protected conferenceStore: Store<ConferenceState>,
        protected logger: Logger,
        private router: Router,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(conferenceStore, logger);
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }

    onSelfTestCompleted(): void {
        super.onSelfTestCompleted();
        this.selfTestCompleted = true;
        this.continueClicked = false;
    }

    continueParticipantJourney() {
        if (this.continueClicked) {
            return;
        }
        this.continueClicked = true;
        if (!this.selfTestCompleted) {
            this.logger.warn('[ParticipantSelfTest] - Self test not completed.');
            this.raisedSelfTestIncompleted();
        }

        this.logger.debug('[ParticipantSelfTest] - Navigating to camera check.');
        this.router.navigate([pageUrls.CameraWorking, this.conference.id]);
    }

    restartTest() {
        this.continueClicked = false;
        this.logger.debug('[ParticipantSelfTest] - Restarting participant self-test');
        this.selfTestComponent.startTestCall();
    }

    raisedSelfTestIncompleted() {
        const logPayload = {
            conference: this.conference?.id,
            participant: this.participant?.id,
            failureReason: SelfTestFailureReason.IncompleteTest
        };
        this.logger.debug('[ParticipantSelfTest] - Raising incomplete self-test failure', logPayload);
        this.conferenceStore.dispatch(
            SelfTestActions.publishSelfTestFailure({ conferenceId: this.conference.id, reason: SelfTestFailureReason.IncompleteTest })
        );
    }

    private raiseNotSignedIn() {
        this.logger.debug('[ParticipantSelfTest] - Raising participant not signed in');
        this.participantStatusUpdateService
            .postParticipantStatus(EventType.ParticipantNotSignedIn, null)
            .then(() => {
                this.logger.debug('[ParticipantSelfTest] - Participant status was updated to not signed in');
            })
            .catch(err => {
                this.logger.error('[ParticipantSelfTest] - Unable to update status to not signed in', err);
            });
    }
}
