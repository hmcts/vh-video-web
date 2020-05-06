import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponent } from '../models/base-self-test.component';

@Component({
    selector: 'app-participant-self-test',
    templateUrl: './participant-self-test.component.html'
})
export class ParticipantSelfTestComponent extends BaseSelfTestComponent {

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected adalService: AdalService,
        protected logger: Logger
    ) {
        super(route, videoWebService, errorService, adalService, logger);
    }

    onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
        super.onSelfTestCompleted(testcallScore);
        this.continueParticipantJourney();
    }

    continueParticipantJourney() {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.router.navigate([pageUrls.CameraWorking, conferenceId]);
    }

    restartTest() {
        this.logger.debug('restarting participant self-test');
        this.selfTestComponent.replayVideo();
    }
}
