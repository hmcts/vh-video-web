import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';

@Component({
    selector: 'app-independent-self-test',
    templateUrl: './independent-self-test.component.html'
})
export class IndependentSelfTestComponent extends BaseSelfTestComponentDirective {
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected logger: Logger
    ) {
        super(route, videoWebService, errorService, logger);
    }

    equipmentWorksHandler() {
        this.router.navigateByUrl(pageUrls.ParticipantHearingList);
        this.hideSelfTest = true;
    }

    equipmentFaultyHandler() {
        this.showEquipmentFaultMessage = true;
        this.testInProgress = false;
        this.hideSelfTest = true;
    }

    restartTest() {
        this.logger.debug('[IndependentSelfTest] - Restarting self test');
        super.restartTest();
        this.showEquipmentFaultMessage = false;
        this.selfTestComponent.replayVideo();
    }
}
