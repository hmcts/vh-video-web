import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse, AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-participant-self-test',
    templateUrl: './participant-self-test.component.html'
})
export class ParticipantSelfTestComponent extends BaseSelfTestComponentDirective {
    selfTestCompleted = false;
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected adalService: AdalService,
        protected logger: Logger,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(route, videoWebService, errorService, adalService, logger);
    }

    onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
        super.onSelfTestCompleted(testcallScore);
        this.selfTestCompleted = true;
    }

    async continueParticipantJourney() {
        if (!this.selfTestCompleted) {
            await this.raisedSelfTestIncompleted();
            await super.skipSelfTest();
        }
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.router.navigate([pageUrls.CameraWorking, conferenceId]);
    }

    restartTest() {
        this.logger.debug('restarting participant self-test');
        this.selfTestComponent.replayVideo();
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler($event: any) {
        $event.returnValue = 'save';
        this.raiseNotSignedIn();
        return 'save';
    }

    private raiseNotSignedIn() {
        this.participantStatusUpdateService
            .postParticipantStatus(EventType.ParticipantNotSignedIn, null)
            .then(() => {
                this.logger.info('Participant status was updated to not signed in');
            })
            .catch(err => {
                this.logger.error('Unable to update status to not signed in', err);
            });
    }

    async raisedSelfTestIncompleted() {
        try {
            await this.videoWebService.raiseSelfTestFailureEvent(
                this.conferenceId,
                new AddSelfTestFailureEventRequest({
                    self_test_failure_reason: SelfTestFailureReason.IncompleteTest
                })
            );
            this.logger.info('Self-test is incompleted.');
        } catch (error) {
            this.logger.error('Failed to raise "SelfTestFailureEvent"', error);
        }
    }
}
