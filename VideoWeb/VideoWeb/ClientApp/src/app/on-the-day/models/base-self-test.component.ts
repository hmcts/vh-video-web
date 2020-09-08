import { OnInit, ViewChild, Directive } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ParticipantResponse, SelfTestPexipResponse, TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';

@Directive()
export abstract class BaseSelfTestComponent implements OnInit {
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
            this.getConference();
        } else {
            this.getPexipConfig();
        }
        this.testInProgress = false;
    }

    async getConference(): Promise<void> {
        this.logger.debug(`retrieving conference ${this.conferenceId}`);
        try {
            this.conference = await this.videoWebService.getConferenceById(this.conferenceId);
            this.logger.debug(`retrieved conference ${this.conferenceId} successfully`);
            this.participant = this.conference.participants.find(
                x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase()
            );
            this.loadingData = false;
        } catch (error) {
            this.loadingData = false;
            this.errorService.handleApiError(error);
        }
    }

    async getPexipConfig(): Promise<void> {
        this.logger.debug(`retrieving pexip configuration`);
        try {
            this.selfTestPexipConfig = await this.videoWebService.getPexipConfig();
            this.logger.debug(`retrieved pexip configuration successfully`);
            this.logger.debug('Self test Pexip cofig: ' + JSON.stringify(this.selfTestPexipConfig));
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    onTestStarted() {
        this.testInProgress = true;
    }

    restartTest() {
        this.testInProgress = false;
        this.hideSelfTest = false;
    }

    onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
        this.testInProgress = false;
        this.logger.debug(`self test completed`);
        if (testcallScore) {
            this.logger.debug(testcallScore.toJSON());
        }
    }
}
