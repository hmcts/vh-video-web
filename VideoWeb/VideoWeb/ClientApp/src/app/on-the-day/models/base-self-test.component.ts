import { OnInit, ViewChild, Directive } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ParticipantResponse, SelfTestPexipResponse, TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { SelfTestComponent } from 'src/app/shared/self-test/self-hmcts.netponent';

@Directive()
export abstract class BaseSelfTestComponentDirective implements OnInit {
    @ViewChild(SelfTestComponent, { static: false })
    selfTestComponent: SelfTestComponent;

    testInProgress: boolean;
    hideSelfTest = false;

    loadingData: boolean;
    conference: ConferenceResponse;
    participant: ParticipantResponse;
    conferenceId: string;
    selfTestPexipConfig: SelfTestPexipResponse;

    showEquipmentFaultMessage: boolean;
    contact = {
        phone: vhContactDetails.phone
    };

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected adalService: AdalService,
        protected logger: Logger
    ) {
        this.showEquipmentFaultMessage = false;
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        if (this.conferenceId) {
            this.logger.debug('[SelfTest] - Conference id found, initialising test from conference details');
            this.getConference();
        } else {
            this.logger.debug('[SelfTest] - Conference id not found, initialising test from settings');
            this.getPexipConfig();
        }
        this.testInProgress = false;
    }

    async getConference(): Promise<void> {
        this.logger.debug(`[SelfTest] - retrieving conference ${this.conferenceId}`);
        try {
            this.conference = await this.videoWebService.getConferenceById(this.conferenceId);
            this.logger.debug(`[SelfTest] - retrieved conference ${this.conferenceId} successfully`);

            const loggedInUser = await this.videoWebService.getCurrentParticipant(this.conferenceId);
            this.participant = this.conference.participants.find(x => x.id === loggedInUser.participant_id);

            this.loadingData = false;
        } catch (error) {
            this.loadingData = false;
            this.logger.warn('[SelfTest] - There was a problem getting conference details', { conference: this.conferenceId });
            this.errorService.handleApiError(error);
        }
    }

    async getPexipConfig(): Promise<void> {
        this.logger.debug(`[SelfTest] - retrieving pexip configuration`);
        try {
            this.selfTestPexipConfig = await this.videoWebService.getPexipConfig();
            this.logger.debug(`[SelfTest] - Retrieved pexip configuration successfully`, this.selfTestPexipConfig);
        } catch (error) {
            this.logger.warn('[SelfTest] - There was a problem getting pexip config');
            this.errorService.handleApiError(error);
        }
    }

    onTestStarted() {
        this.testInProgress = true;
    }

    restartTest() {
        this.logger.debug('[SelfTest] - restarting self test');
        this.testInProgress = false;
        this.hideSelfTest = false;
    }

    onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
        this.testInProgress = false;
        this.logger.debug('[SelfTest] - self test completed');
        if (testcallScore) {
            this.logger.debug(`[SelfTest] - ${testcallScore.toJSON()}`);
        }
    }
}
