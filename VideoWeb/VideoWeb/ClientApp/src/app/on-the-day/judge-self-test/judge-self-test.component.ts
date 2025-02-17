import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';

@Component({
    standalone: false,
    selector: 'app-judge-self-test',
    templateUrl: './judge-self-test.component.html'
})
export class JudgeSelfTestComponent extends BaseSelfTestComponentDirective {
    @ViewChild(SelfTestComponent, { static: false })
    selfTestComponent: SelfTestComponent;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected errorService: ErrorService,
        protected logger: Logger
    ) {
        super(route, videoWebService, profileService, errorService, logger);
    }

    equipmentWorksHandler() {
        this.logger.debug('[JudgeSelfTest] - Equiptment works clicked. Navigating to Judge hearing list.');
        this.router.navigateByUrl(pageUrls.JudgeHearingList);
        this.hideSelfTest = true;
    }

    equipmentFaultyHandler() {
        this.showEquipmentFaultMessage = true;
        this.testInProgress = false;
        this.hideSelfTest = true;
    }

    restartTest() {
        this.logger.debug('[JudgeSelfTest] - Restarting self test.');
        super.restartTest();
        this.showEquipmentFaultMessage = false;
        this.selfTestComponent.replayVideo();
    }
}
