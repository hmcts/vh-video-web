import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';
import { Store } from '@ngrx/store';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';

@Component({
    standalone: false,
    selector: 'app-judge-self-test',
    templateUrl: './judge-self-test.component.html'
})
export class JudgeSelfTestComponent extends BaseSelfTestComponentDirective {
    @ViewChild(SelfTestV2Component, { static: false })
    selfTestComponent: SelfTestV2Component;

    constructor(
        private router: Router,
        protected conferenceStore: Store<ConferenceState>,
        protected logger: Logger
    ) {
        super(conferenceStore, logger);
    }

    equipmentWorksHandler() {
        this.logger.debug('[JudgeSelfTest] - Equiptment works clicked. Navigating to Judge hearing list.');
        this.router.navigateByUrl(pageUrls.JudgeHearingList);
    }

    equipmentFaultyHandler() {
        this.showEquipmentFaultMessage = true;
        this.testInProgress = false;
    }

    restartTest() {
        this.logger.debug('[JudgeSelfTest] - Restarting self test.');
        super.restartTest();
        this.showEquipmentFaultMessage = false;
        this.selfTestComponent.startTestCall();
    }
}
