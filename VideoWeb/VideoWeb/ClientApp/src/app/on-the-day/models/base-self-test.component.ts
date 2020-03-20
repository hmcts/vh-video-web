import { OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ParticipantResponse, SelfTestPexipResponse, TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';

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
        phone: VhContactDetails.phone
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

    getConference(): void {
        this.logger.debug(`retrieving conference ${this.conferenceId}`);
        this.videoWebService.getConferenceById(this.conferenceId).then(
            response => {
                this.logger.debug(`retrieved conference ${this.conferenceId} successfully`);
                this.loadingData = false;
                this.conference = response;
                this.participant = response.participants.find(
                    x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase()
                );
            },
            error => {
                this.loadingData = false;
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            }
        );
    }

    async getPexipConfig(): Promise<void> {
        this.logger.debug(`retrieving pexip configuration`);
        try {
            this.selfTestPexipConfig = await this.videoWebService.getPexipConfig();
            this.logger.debug(`retrieved pexip configuration successfully`);
            this.logger.debug('Self test Pexip cofig: ' + JSON.stringify(this.selfTestPexipConfig));
        } catch (error) {
            if (!this.errorService.returnHomeIfUnauthorised(error)) {
                this.errorService.handleApiError(error);
            }
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
