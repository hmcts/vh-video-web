import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponent } from '../models/base-self-test.component';

@Component({
    selector: 'app-independent-self-test',
    templateUrl: './independent-self-test.component.html'
})
export class IndependentSelfTestComponent extends BaseSelfTestComponent {
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
        this.logger.debug('representative self-test');
        super.restartTest();
        this.showEquipmentFaultMessage = false;
        this.selfTestComponent.replayVideo();
    }
}
