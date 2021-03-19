import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse, AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';

@Component({
    selector: 'app-participant-self-test',
    templateUrl: './participant-self-test.component.html'
})
export class ParticipantSelfTestComponent extends BaseSelfTestComponentDirective {
    selfTestCompleted = false;
    continueClicked: boolean;
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected logger: Logger,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(route, videoWebService, errorService, logger);
    }

    onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
        super.onSelfTestCompleted(testcallScore);
        this.selfTestCompleted = true;
        this.continueClicked = false;
    }

    async continueParticipantJourney() {
        if (this.continueClicked) {
            return;
        }
        this.continueClicked = true;
        if (!this.selfTestCompleted) {
            this.logger.warn('[ParticipantSelfTest] - Self test not completed.');
            this.selfTestComponent.disconnect();
            const reason = new DisconnectedCall('Conference terminated by another participant');
            await this.selfTestComponent.handleCallDisconnect(reason);
            await this.raisedSelfTestIncompleted();
        }
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.logger.warn('[ParticipantSelfTest] - Navigating to camera check.');
        this.router.navigate([pageUrls.CameraWorking, conferenceId]);
    }

    restartTest() {
        this.continueClicked = false;
        this.logger.debug('[ParticipantSelfTest] - Restarting participant self-test');
        this.selfTestComponent.replayVideo();
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }

    private raiseNotSignedIn() {
        this.logger.debug('[ParticipantSelfTest] - Raising participant not signed in');
        this.participantStatusUpdateService
            .postParticipantStatus(EventType.ParticipantNotSignedIn, null)
            .then(() => {
                this.logger.info('[ParticipantSelfTest] - Participant status was updated to not signed in');
            })
            .catch(err => {
                this.logger.error('[ParticipantSelfTest] - Unable to update status to not signed in', err);
            });
    }

    async raisedSelfTestIncompleted() {
        const logPayload = {
            conference: this.conference.id,
            participant: this.participant.id,
            failureReason: SelfTestFailureReason.IncompleteTest
        };
        this.logger.debug('[ParticipantSelfTest] - Raising incomplete self-test failure', logPayload);
        try {
            await this.videoWebService.raiseSelfTestFailureEvent(
                this.conferenceId,
                new AddSelfTestFailureEventRequest({
                    self_test_failure_reason: SelfTestFailureReason.IncompleteTest
                })
            );
            this.logger.debug('[ParticipantSelfTest] - Raised self-test failure event', logPayload);
        } catch (error) {
            this.logger.error('[ParticipantSelfTest] - Failed to raise "SelfTestFailureEvent"`', error, logPayload);
        }
    }
}
