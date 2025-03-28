import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponentDirective } from '../models/base-self-test.component';
import { Store } from '@ngrx/store';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';

@Component({
    standalone: false,
    selector: 'app-independent-self-test',
    templateUrl: './independent-self-test.component.html'
})
export class IndependentSelfTestComponent extends BaseSelfTestComponentDirective {
    contactDetails = vhContactDetails;

    constructor(
        private router: Router,
        protected conferenceStore: Store<ConferenceState>,
        protected logger: Logger
    ) {
        super(conferenceStore, logger);
    }

    equipmentWorksHandler() {
        if (this.isStaffMember) {
            this.router.navigateByUrl(pageUrls.StaffMemberHearingList);
        } else {
            this.router.navigateByUrl(pageUrls.ParticipantHearingList);
        }
    }

    equipmentFaultyHandler() {
        this.showEquipmentFaultMessage = true;
        this.testInProgress = false;
    }

    restartTest() {
        this.logger.debug('[IndependentSelfTest] - Restarting self test');
        super.restartTest();
        this.showEquipmentFaultMessage = false;
        this.selfTestComponent.startTestCall();
    }
}
